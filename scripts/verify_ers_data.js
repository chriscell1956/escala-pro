import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log("Verifying ERS Data...");

  // Check if 'tipo' has values other than 'NORMAL'
  const { data, error } = await supabase
    .from("alocacoes")
    .select("tipo, vigilante_id")
    .neq("tipo", "NORMAL")
    .limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Non-NORMAL allocations found:", data);
    if (data.length > 0) {
      console.log("✅ SUCCESS: Team info found in 'tipo' column.");
    } else {
      console.log(
        "⚠️ WARNING: No team info found in 'tipo'. Migration might have defaulted to NORMAL or inputs were empty.",
      );
    }
  }
}

verify();
