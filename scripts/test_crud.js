import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCrud() {
  console.log("🛠️ Iniciando Teste Manual de Banco (CRUD)...");

  // 1. CREATE
  const testSector = {
    nome: "TESTE_MANUAL_" + Date.now(),
    campus: "LABORATORIO",
    codigo_radio: "TEST",
  };
  console.log(`1. Criando setor teste: ${testSector.nome}...`);

  const { data: created, error: createErr } = await supabase
    .from("setores")
    .insert(testSector)
    .select()
    .single();

  if (createErr) {
    console.error("❌ Erro ao criar:", createErr.message);
    return;
  }
  console.log("✅ Setor Criado com ID:", created.id);

  // 2. READ
  console.log("2. Lendo setor...");
  const { data: read, error: readErr } = await supabase
    .from("setores")
    .select("*")
    .eq("id", created.id)
    .single();

  if (readErr || !read) {
    console.error(
      "❌ Erro ao ler:",
      readErr ? readErr.message : "Não encontrado",
    );
    return;
  }
  console.log("✅ Leitura OK:", read.nome);

  // 3. DELETE
  console.log("3. Apagando setor...");
  const { error: delErr } = await supabase
    .from("setores")
    .delete()
    .eq("id", created.id);

  if (delErr) {
    console.error("❌ Erro ao apagar:", delErr.message);
    return;
  }
  console.log("✅ Setor apagado com sucesso.");
  console.log("🎉 BANCO ESTÁ FUNCIONANDO PERFEITAMENTE!");
}

testCrud();
