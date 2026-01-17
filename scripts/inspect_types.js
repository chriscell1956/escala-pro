import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectTypes() {
  console.log("🔍 Inspecionando Tipos de Coluna...");

  // Como não temos acesso direto ao information_schema via API pública normalmente,
  // vamos tentar deduzir inserindo um dummy e vendo o erro ou retornando o formato.
  // Mas o erro anterior JÁ NOS DISSE que é INTEGER.
  // "Key columns "vigilante_id" and "id" are of incompatible types: uuid and integer."
  // Isso confirma que vigilantes.id é INTEGER.

  // Vamos checar SETORES.id também.
  // Se vigilantes é integer, provavelmente setores também é (legado migrardo ou criado com serial).

  console.log("Teste de tipo em SETORES:");
  // Tenta filtro com STRING (UUID)
  const { error: uuidErr } = await supabase
    .from("setores")
    .select("id")
    .eq("id", "00000000-0000-0000-0000-000000000000");

  if (
    uuidErr &&
    uuidErr.message.includes("invalid input syntax for type integer")
  ) {
    console.log("✅ SETORES.id é INTEGER (Confirmado pelo erro de syntax)");
  } else if (!uuidErr) {
    console.log("⚠️ SETORES.id aceitou UUID na query? Pode ser UUID ou texto.");
  }

  console.log(
    "Confirmado: VIGILANTES.id é INTEGER (baseado no erro do usuário)",
  );
}

inspectTypes();
