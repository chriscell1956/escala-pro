import { createClient } from "@supabase/supabase-js";

// --- CLIENTE NOVO (DESTINO) ---
const NEW_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const NEW_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";
const targetDb = createClient(NEW_URL, NEW_KEY);

// --- CLIENTE ANTIGO (ORIGEM) ---
const OLD_URL = "https://tohwctqdhvppjggvxcqq.supabase.co";
const OLD_KEY = "sb_publishable_vwXbsj19SGdRdo2OChyJjA_Mq9g86Vw";
const sourceDb = createClient(OLD_URL, OLD_KEY);

async function runManualMigration() {
  console.log("🚀 INICIANDO MIGRAÇÃO MANUAL (V2)...");

  // 1. BUSCAR DADOS
  console.log("📥 [1/4] Baixando JSON do banco antigo...");
  const key = "unoeste_pro_1"; // Janeiro
  const { data: sourceData, error: srcErr } = await sourceDb
    .from("escalas")
    .select("dados")
    .eq("nome", key)
    .single();

  if (srcErr || !sourceData) {
    console.error("❌ Erro ao baixar dados:", srcErr?.message);
    return;
  }
  const vigilantes = sourceData.dados;
  console.log(`✅ Recebido: ${vigilantes.length} vigilantes do JSON.`);

  // 2. PROCESSAR SETORES (COM UNICIDADE NA MÃO)
  console.log("🏢 [2/4] Sincronizando Setores...");

  // Cache local para não bater no banco toda hora
  const sectorMap = new Map(); // "NOME|CAMPUS" -> ID

  // Primeiro, vamos ver o que já tem no banco novo
  const { data: existingSectors } = await targetDb.from("setores").select("*");
  if (existingSectors) {
    existingSectors.forEach((s) =>
      sectorMap.set(`${s.nome}|${s.campus}`, s.id),
    );
  }

  let novosSetores = 0;
  for (const v of vigilantes) {
    let nomeSetor = v.setor || "AGUARDANDO";
    let campus = v.campus || "S/ CAMPUS";

    // Normalização básica
    nomeSetor = nomeSetor.trim().toUpperCase();
    campus = campus.trim().toUpperCase();

    if (nomeSetor === "AGUARDANDO" || nomeSetor === "A DEFINIR") continue;

    const mapKey = `${nomeSetor}|${campus}`;

    if (!sectorMap.has(mapKey)) {
      // Criar setor novo
      const payload = {
        nome: nomeSetor,
        campus: campus,
        codigo_radio: "IMP-" + Math.floor(Math.random() * 1000), // Gerando código obrigatório
      };

      // Tenta criar (Se der erro de constraint, tenta select)
      const { data: newS, error: createErr } = await targetDb
        .from("setores")
        .insert(payload)
        .select()
        .single();

      if (newS) {
        sectorMap.set(mapKey, newS.id);
        novosSetores++;
      } else if (createErr) {
        // Se falhou (provavelmente race condition ou duplicate key), tenta ler de novo
        const { data: retryS } = await targetDb
          .from("setores")
          .select("id")
          .eq("nome", nomeSetor)
          .eq("campus", campus)
          .single();
        if (retryS) sectorMap.set(mapKey, retryS.id);
      }
    }
  }
  console.log(
    `✅ Setores processados. Novos: ${novosSetores}. Total no cache: ${sectorMap.size}`,
  );

  // 3. VIGILANTES E ALOCAÇÕES
  console.log("👮 [3/4] Migrando Vigilantes e Alocações...");

  let totalVigs = 0;
  let totalAlocs = 0;
  const TARGET_MONTH = "2026-01"; // Janeiro

  for (const v of vigilantes) {
    const nomeSetor = (v.setor || "AGUARDANDO").trim().toUpperCase();
    const campus = (v.campus || "S/ CAMPUS").trim().toUpperCase();

    const setorId = sectorMap.get(`${nomeSetor}|${campus}`) || null;

    // Upsert Vigilante
    const vigPayload = {
      matricula: v.mat, // Assumindo único
      nome: v.nome,
      equipe_padrao: v.eq,
      setor_id_padrao: setorId, // Vincula ao setor encontrado/criado!
    };

    const { data: vigSaved, error: vigErr } = await targetDb
      .from("vigilantes")
      .upsert(vigPayload, { onConflict: "matricula" })
      .select("id")
      .single();

    if (vigErr || !vigSaved) {
      console.error(`❌ Erro Vig ${v.nome}:`, vigErr?.message);
      continue;
    }
    totalVigs++;

    // Processar DIAS (Alocações)
    if (Array.isArray(v.dias) && v.dias.length > 0) {
      // Lista de inserts para fazer batch
      const alocRows = v.dias.map((day) => ({
        vigilante_id: vigSaved.id, // ID numérico do banco
        setor_id: setorId, // ID numérico do setor
        data: `${TARGET_MONTH}-${String(day).padStart(2, "0")}`,
        tipo: "NORMAL",
      }));

      // Inserts ignorando duplicatas (onConflict do nothing ou upsert)
      const { error: alocErr } = await targetDb
        .from("alocacoes")
        .upsert(alocRows, { onConflict: "vigilante_id, data" });

      if (alocErr) {
        console.error(`❌ Erro Aloc ${v.nome}:`, alocErr.message);
      } else {
        totalAlocs += alocRows.length;
      }
    }
  }

  console.log("🏁 MIGRAÇÃO FINALIZADA!");
  console.log(
    `📊 Resumo: ${totalVigs} Vigilantes, ${totalAlocs} Alocações importadas.`,
  );
}

runManualMigration();
