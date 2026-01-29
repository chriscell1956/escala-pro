
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log("🔍 Checking Wesley (100961)...");

    const { data: v, error } = await supabase
        .from("vigilantes")
        .select("*")
        .eq("matricula", "100961")
        .single();

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    if (!v) {
        console.error("❌ Not found!");
        return;
    }

    console.log("✅ DB State:");
    console.log(`   Matricula: ${v.matricula}`);
    console.log(`   Nome:      ${v.nome}`);
    console.log(`   Equipe:    ${v.equipe}`); // THIS IS THE TRUTH
    console.log(`   ID Num:    ${v.id_num}`);
}

check();
