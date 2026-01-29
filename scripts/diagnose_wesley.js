
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    console.log("🔍 Diagnosing Wesley (100961)...");

    const { data: v, error } = await supabase
        .from("vigilantes")
        .select("*")
        .eq("matricula", "100961")
        .single();

    if (error) {
        console.error("❌ Error fetching Wesley:", error);
        return;
    }

    if (!v) {
        console.error("❌ Wesley not found in DB!");
        return;
    }

    console.log("✅ Wesley found:");
    console.log("   ID:", v.id);
    console.log("   Nome:", v.nome);
    console.log("   Matricula:", v.matricula);
    console.log("   Equipe (DB):", v.equipe);
    console.log("   Ativo:", v.ativo);

    // Check allocations to see if they match
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const startOfMonth = `${year}-${month}-01`;
    const endOfMonth = `${year}-${month}-31`;

    const { data: alocs } = await supabase
        .from("alocacoes")
        .select("*")
        .eq("vigilante_id", v.id)
        .gte("data", startOfMonth)
        .lte("data", endOfMonth);

    console.log(`\n📊 Allocations for ${month}/${year}: ${alocs.length} records`);

    if (alocs.length > 0) {
        // Group by team type
        const counts = {};
        alocs.forEach(a => {
            counts[a.tipo] = (counts[a.tipo] || 0) + 1;
        });
        console.log("   Team Distribution in Allocations:", counts);
    }

    // Attempt to fix if argument provided
    const args = process.argv.slice(2);
    if (args[0] === '--fix-team') {
        const newTeam = args[1];
        if (!newTeam) {
            console.error("⚠️ Please provide a team to set (e.g. node diagnose.js --fix-team D)");
            return;
        }
        console.log(`\n🛠️ Attempting to fix Team to '${newTeam}'...`);
        const { error: updateErr } = await supabase
            .from("vigilantes")
            .update({ equipe: newTeam })
            .eq("id", v.id);

        if (updateErr) console.error("❌ Update failed:", updateErr);
        else console.log("✅ Update successful!");
    }
}

diagnose();
