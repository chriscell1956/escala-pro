import { createClient } from "@supabase/supabase-js";

// --- CONFIGURAÇÃO ---
const SUPABASE_URL = "https://tohwctqdhvppjggvxcqq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vwXbsj19SGdRdo2OChyJjA_Mq9g86Vw"; // Service Role seria ideal, mas usaremos a disponível
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPER: CONVERSÃO DE DADOS (DB Relacional -> Legacy JSON) ---

/**
 * Converte Vigilantes + Alocações (DB) -> Vigilante[] (JSON)
 */
export async function getLegacySchedule(month) {
  // 1. Buscar Vigilantes
  const { data: vigs, error: errV } = await supabase
    .from("vigilantes")
    .select("*");
  if (errV) throw errV;

  // 2. Buscar Alocações do Mês
  // Calcular range de datas do mês
  const year = 2026; // TODO: Extrair do 'month' (ex: 202601) ou parametrizar melhor
  // Mas o frontend manda month como number? ex: 1. Precisamos saber o ano.
  // Assumindo ano atual ou lógica de negócio. O 'month' no frontend usually is just 1..12 or 202501?
  // Olhando api.ts: loadData(month).

  // Vamos baixar TODAS as alocações para simplificar o MVP ou filtrar se possível
  const { data: alocs, error: errA } = await supabase
    .from("alocacoes")
    .select("*");
  // Otimização futura: .gte('data', startOfMonth).lte('data', endOfMonth)

  // 3. Buscar Afastamentos / Férias
  const { data: ferias } = await supabase.from("ferias").select("*");
  const { data: afast } = await supabase.from("afastamentos").select("*");

  // 4. Montar Objeto Legacy
  return vigs.map((v) => {
    // Filtrar alocações deste vigilante
    const myAlocs = alocs.filter((a) => a.vigilante_id === v.id);
    const dias = myAlocs.map((a) => parseInt(a.data.split("-")[2])); // Extrair dia do mês (YYYY-MM-DD)

    // Tentar descobrir Campus/Setor atual (pega do cadastro ou da alocação mais frequente)
    // No modelo antigo, campus/setor ficavam no objeto do vigilante.
    // Vamos usar o que está na tabela vigilantes se existir, ou o primeiro do mês.

    return {
      mat: v.matricula,
      nome: v.nome,
      eq: v.equipe || "A DEFINIR", // Fallback
      campus: v.campus || "SEM POSTO", // Se tiver na tabela vigilantes
      setor: v.setor || "AGUARDANDO",

      // App State Reconstruction
      dias: dias.sort((a, b) => a - b),
      folgasGeradas: [], // Difícil persistir se não tiver tabela, ou inferir
      faltas: [], // Preencher via tabela 'afastamentos'
      vacation: null, // Preencher via tabela 'ferias'

      // Campos legados necessários
      horario: v.horario_padrao || "",
      refeicao: "",
      manualLock: false,
      // ... outros campos default
    };
  });
}

/**
 * Salva Legacy JSON -> DB Relacional
 * Essa é a parte complexa: transformar o JSONzão em inserts/updates.
 */
export async function saveLegacySchedule(month, legacyData) {
  if (!Array.isArray(legacyData)) throw new Error("Invalid Format");

  // Para cada vigilante no JSON
  for (const v of legacyData) {
    // 1. Upsert Vigilante (garantir que existe e atualizar setor fixo se precisar)
    const { data: vigDb, error } = await supabase
      .from("vigilantes")
      .upsert(
        {
          matricula: v.mat,
          nome: v.nome,
          equipe: v.eq,
          // Não atualizar campus/setor aqui se for dinâmico do dia?
          // O frontend trata campus/setor como "estado atual". Vamos salvar.
        },
        { onConflict: "matricula" },
      )
      .select()
      .single();

    if (error || !vigDb) continue;

    const vigId = vigDb.id;

    // 2. Sincronizar Alocações (Dias trabalhados)
    // Estratégia "Bruta": Limpar alocações do mês para este guarda e recriar.
    // Precisamos saber o Mês/Ano exatos.
    // Supondo 2026/01 para teste.

    // ... implementação pendente de detalhes de data ...
  }
  return true;
}
