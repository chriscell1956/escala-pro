import { createClient } from "@supabase/supabase-js";

const OLD_URL = "https://tohwctqdhvppjggvxcqq.supabase.co";
const OLD_KEY = "sb_publishable_vwXbsj19SGdRdo2OChyJjA_Mq9g86Vw";
const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function analyze() {
  console.log("🔍 Analisando dados da FONTE (Banco Antigo)...");
  const key = "unoeste_pro_1";

  const { data } = await oldSupabase
    .from("escalas")
    .select("dados")
    .eq("nome", key)
    .single();
  if (!data || !data.dados) return console.log("Sem dados.");

  const vigs = data.dados;
  const sectorCounts = {};

  vigs.forEach((v) => {
    const s = v.setor || "UNDEFINED";
    sectorCounts[s] = (sectorCounts[s] || 0) + 1;
  });

  console.log("📊 Distribuição de Setores no JSON Original:");
  console.table(sectorCounts);
}

analyze();
