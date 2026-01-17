import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspect() {
  console.log("--- FULL SCHEMA INSPECTION ---");

  const tables = ["setores"];

  for (const t of tables) {
    console.log(`\nTABLE: [${t}]`);
    // Get 1 row to see keys
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log("Error:", error.message);
      continue;
    }
    if (data && data.length > 0) {
      console.log("Columns:");
      Object.keys(data[0]).forEach((k) => console.log(`  - ${k}`));
      // Show sample data for 'equipe' check
      console.log("Sample:", JSON.stringify(data[0]));
    } else {
      console.log("(Table exists but is empty)");
    }
  }
}

inspect();
