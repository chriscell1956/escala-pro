import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkColumn(colName) {
  const { data, error } = await supabase
    .from("usuarios")
    .select(colName)
    .limit(1);
  if (error) {
    console.log(`[FAIL] ${colName}:`, error.message);
  } else {
    console.log(`[OK]   ${colName}`);
  }
}

async function main() {
  console.log("Probing columns...");
  await checkColumn("id");
  await checkColumn("matricula");
  await checkColumn("nome");
  await checkColumn("name");
  await checkColumn("email");
  await checkColumn("password");
  await checkColumn("senha");
  await checkColumn("role");
  await checkColumn("cargo");
  await checkColumn("created_at");
}

main();
