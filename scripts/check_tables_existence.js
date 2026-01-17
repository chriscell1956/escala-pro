import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  console.log("🔍 Listando tabelas...");

  // Tenta inserir e falhar para ver se tabela existe, ou usar um método hacky
  // O Supabase-js não tem 'show tables' direto no client publico.
  // Vamos tentar dar select limit 0 em cada tabela esperada.

  const targetTables = [
    "vigilantes",
    "setores",
    "alocacoes",
    "usuarios",
    "ferias",
    "solicitacoes_folga",
  ];

  for (const table of targetTables) {
    const { error } = await supabase.from(table).select("*").limit(0);
    if (error) {
      console.log(`❌ ${table}: ${error.code} - ${error.message}`);
    } else {
      console.log(`✅ ${table}: Existe (Acesso OK)`);
    }
  }
}

checkTables();
