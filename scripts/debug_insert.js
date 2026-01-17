import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Attempting insert...");
  const { data, error, count } = await supabase
    .from("usuarios")
    .upsert(
      [
        {
          matricula: "99999",
          nome: "DEBUG USER",
          role: "TEST",
          senha: "123",
        },
      ],
      { onConflict: "matricula", count: "exact" },
    )
    .select();

  console.log("Error:", error);
  console.log("Data:", data);
  console.log("Count:", count);

  // Check if actually inserted
  const { count: finalCount } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true });
  console.log("Total rows in usuarios:", finalCount);
}

main();
