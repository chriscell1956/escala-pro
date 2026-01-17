import { createClient } from "@supabase/supabase-js";

// Credenciais do "Antigo" (Produção Atual) achadas em api.ts
const OLD_URL = "https://tohwctqdhvppjggvxcqq.supabase.co";
const OLD_KEY = "sb_publishable_vwXbsj19SGdRdo2OChyJjA_Mq9g86Vw";

const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function checkOldData() {
  try {
    console.log("conectando ao banco antigo...");
    // Tenta buscar a escala de Janeiro (mês 1)
    // A chave no código era `unoeste_pro_${month}`
    const key = "unoeste_pro_1";

    const { data, error } = await oldSupabase
      .from("escalas")
      .select("*")
      .eq("nome", key)
      .single();

    if (error) {
      console.error("Erro ao buscar dados:", error.message);
      // Tenta listar tudo pra ver as chaves
      console.log("Tentando listar chaves disponíveis...");
      const { data: list } = await oldSupabase
        .from("escalas")
        .select("nome")
        .limit(10);
      console.log(
        "Chaves encontradas:",
        list?.map((i) => i.nome),
      );
      return;
    }

    if (data) {
      console.log("✅ DADOS ENCONTRADOS!");
      console.log(`Chave: ${data.nome}`);
      const vigs = data.dados;
      console.log(
        `Vigilantes encontrados: ${Array.isArray(vigs) ? vigs.length : "Formato inválido"}`,
      );
      if (Array.isArray(vigs) && vigs.length > 0) {
        console.log("Exemplo:", vigs[0].nome, vigs[0].setor);
      }
    }
  } catch (e) {
    console.error("Exceção:", e);
  }
}

checkOldData();
