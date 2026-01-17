import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tohwctqdhvppjggvxcqq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vwXbsj19SGdRdo2OChyJjA_Mq9g86Vw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tables = [
  "vigilantes",
  "usuarios",
  "setores",
  "jornadas",
  "setor_jornada",
  "alocacoes",
  "ferias",
  "afastamentos",
  "logs",
];

async function checkTables() {
  console.log("Verifying tables...");
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.error(
        `❌ Table '${table}' check failed: ${error.message} (Code: ${error.code})`,
      );
    } else {
      console.log(`✅ Table '${table}' exists.`);
    }
  }
}

checkTables();
