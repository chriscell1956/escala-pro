import { createClient } from "@supabase/supabase-js";

// Credenciais do LegacyAdapterController
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function probe() {
  const { data, error } = await supabase.from("alocacoes").select("*").limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(
      "Columns found:",
      data && data.length > 0 ? Object.keys(data[0]) : "No data found",
    );
    console.log("Sample:", data);
  }
}

probe();
