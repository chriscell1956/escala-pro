import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkColumn(colName) {
  const { data, error } = await supabase
    .from("vigilantes")
    .select(colName)
    .limit(1);
  if (error) {
    console.log(`[FAIL] ${colName}:`, error.message);
  } else {
    // Check if data actually has the field (ignoring nulls)
    console.log(`[OK]   ${colName} exists!`);
  }
}

async function main() {
  console.log("Probing VIGILANTES columns...");
  await checkColumn("id");
  await checkColumn("vigilante_id");
  await checkColumn("uuid");
}

main();
