
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
// Using the same ANON KEY as ClientAdapter
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchData() {
    console.log("🔍 Searching for 'Wesley'...");
    const { data: v, error: vErr } = await supabase
        .from("vigilantes")
        .select("id, matricula, nome")
        .ilike("nome", "%Wesley%")
        .limit(5);

    if (vErr) console.error("❌ Error fetching vigilante:", vErr);
    else console.log("✅ Vigilantes found:", v);

    console.log("🔍 Fetching Sectors (Alpha 1)...");
    const { data: s, error: sErr } = await supabase
        .from("setores")
        .select("id, nome, campus, equipe")
        .limit(10);

    if (sErr) console.error("❌ Error fetching sectors:", sErr);
    else console.log("✅ Sectors sample:", s);
}

fetchData();
