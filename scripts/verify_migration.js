import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log("🔍 Verificando integridade dos dados migrados...");

  // 1. Vigilantes
  const { count: vCount, error: vErr } = await supabase
    .from("vigilantes")
    .select("*", { count: "exact", head: true });
  if (vErr) console.error("Erro Vigilantes:", vErr.message);
  else console.log(`👮 Vigilantes: ${vCount}`);

  // 2. Setores
  const { count: sCount, error: sErr } = await supabase
    .from("setores")
    .select("*", { count: "exact", head: true });
  if (sErr) console.error("Erro Setores:", sErr.message);
  else console.log(`🏢 Setores: ${sCount}`);

  // 3. Alocações (Total)
  const { count: aCount, error: aErr } = await supabase
    .from("alocacoes")
    .select("*", { count: "exact", head: true });
  if (aErr) console.error("Erro Alocações:", aErr.message);
  else console.log(`📅 Alocações (Dias trabalhados): ${aCount}`);

  // 4. Checagem de Amostra
  const { data: sample } = await supabase
    .from("vigilantes")
    .select("nome, setor:setores(nome)")
    .limit(3);
  if (sample && sample.length > 0) {
    console.log(
      "📋 Amostra:",
      sample.map((v) => `${v.nome} (${v.setor?.nome})`),
    );
  }
}

verify();
