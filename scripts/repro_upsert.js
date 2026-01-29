
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reproUpsert() {
    console.log("🧪 Starting Upsert Reproduction...");
    const MATRICULA = "100961";
    const NEW_TEAM = "B";

    // 1. Get Current State
    const { data: currentVig } = await supabase
        .from("vigilantes")
        .select("*")
        .eq("matricula", MATRICULA)
        .single();

    console.log("📊 Current State:", {
        id: currentVig.id,
        mat: currentVig.matricula,
        equipe: currentVig.equipe
    });

    // 2. Prepare Payload (Mimicking LegacyAdapterController)
    // Logic: const p = { matricula: cleanMat, nome: v.nome, equipe: v.eq || "A", ativo: true };
    //        if (existingId) p.id = existingId;
    const payload = {
        matricula: currentVig.matricula,
        nome: currentVig.nome,
        equipe: NEW_TEAM,
        ativo: true,
        id: currentVig.id // mimics legacy logic
    };

    console.log("🚀 Upserting Payload:", payload);

    // 3. Execute Upsert
    const { data, error } = await supabase
        .from("vigilantes")
        .upsert([payload], { onConflict: 'matricula' })
        .select();

    if (error) {
        console.error("❌ Upsert Error:", error);
    } else {
        console.log("✅ Upsert Success. Result:", data);
    }

    // 4. Verify Result
    const { data: finalVig } = await supabase
        .from("vigilantes")
        .select("*")
        .eq("matricula", MATRICULA)
        .single();

    console.log("📉 Final State:", {
        id: finalVig.id,
        mat: finalVig.matricula,
        equipe: finalVig.equipe
    });

    if (finalVig.equipe === NEW_TEAM) {
        console.log("✅ TEST PASSED: Team updated correctly.");
    } else {
        console.log("❌ TEST FAILED: Team did NOT update.");
    }
}

reproUpsert();
