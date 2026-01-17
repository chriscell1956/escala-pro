import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log("🔍 Verificando DETALHES da migração...");

  // 1. Setores - Listar todos para entender porque só tem 1
  const { data: setores, error: sErr } = await supabase
    .from("setores")
    .select("*");
  if (sErr) console.error("Erro Setores:", sErr.message);
  else {
    console.log(`🏢 Setores encontrados (${setores.length}):`);
    setores.forEach((s) =>
      console.log(`   - [${s.id}] ${s.nome} (${s.campus})`),
    );
  }

  // 2. Alocações - Tentar select simples sem count
  const { count, error: aErr } = await supabase
    .from("alocacoes")
    .select("*", { count: "exact", head: true });
  if (aErr) {
    console.error("Erro count alocacoes:", aErr.message);
    // Tentar select normal para ver erro detalhado
    const { error: aErr2 } = await supabase
      .from("alocacoes")
      .select("id")
      .limit(1);
    if (aErr2) console.error("Erro detalhado select alocacoes:", aErr2);
  } else {
    console.log(`📅 Total Alocações: ${count}`);
  }

  // 3. Vigilante Exemplo - Checar se pegou o setor_id
  const { data: vigs } = await supabase
    .from("vigilantes")
    .select("nome, setor_id_padrao")
    .not("setor_id_padrao", "is", null)
    .limit(5);
  console.log(
    `👮 Vigilantes com setor vinculado: ${vigs ? vigs.length : 0} (Exemplos)`,
  );
  if (vigs)
    vigs.forEach((v) =>
      console.log(`   - ${v.nome} -> Setor ${v.setor_id_padrao}`),
    );
}

verify();
