import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkMaster() {
    console.log("Checking Master User (91611)...");
    const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("matricula", "91611")
        .single();

    if (error) {
        console.log("[FAIL] Error fetching master:", error.message);
    } else {
        console.log("[OK] Master User found:");
        console.log("   Matricula:", data.matricula);
        console.log("   Perfil:", data.perfil); // Should be 'MASTER'
        console.log("   Senha:", data.senha);
    }
}

checkMaster();
