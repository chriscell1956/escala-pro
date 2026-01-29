
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PROD_API_URL = "https://escalapro.vercel.app/api/escala/202601";

async function testProd() {
    const MATRICULA = "100961";
    const TARGET_TEAM = "B";

    console.log(`🧪 Testing Production API: Setting Wesley to Team ${TARGET_TEAM}...`);

    // 1. Get current state to build minimal payload
    const { data: v } = await supabase.from("vigilantes").select("*").eq("matricula", MATRICULA).single();

    if (!v) {
        console.error("❌ Wesley not found in DB");
        return;
    }
    console.log(`📊 Current DB Team: ${v.equipe}`);

    // 2. Build Payload (Simulating App.tsx)
    // The backend expects { dados: [ ... ] } or [ ... ]
    // We send minimal payload for Wesley
    const payloadVig = {
        mat: v.matricula,
        nome: v.nome,
        eq: TARGET_TEAM, // The change we want
        setor: v.setor || "A DEFINIR",
        campus: v.campus || "A DEFINIR",
        dias: [], // No allocations needed for this test, just profile
        ativo: true
    };

    const body = {
        dados: [payloadVig]
    };

    console.log("🚀 Sending POST to", PROD_API_URL);

    try {
        const res = await fetch(PROD_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const json = await res.json();
        console.log("📡 API Response:", res.status, json);
    } catch (e) {
        console.error("❌ Request Failed:", e);
        return;
    }

    // 3. Verify DB Update
    console.log("⏳ Waiting for DB propagation...");
    await new Promise(r => setTimeout(r, 2000));

    const { data: vFinal } = await supabase.from("vigilantes").select("*").eq("matricula", MATRICULA).single();
    console.log(`📉 Final DB Team: ${vFinal.equipe}`);

    if (vFinal.equipe === TARGET_TEAM) {
        console.log("✅ TEST PASSED: Production Backend updated the team!");
    } else {
        console.log("❌ TEST FAILED: DB Team did NOT update.");
    }
}

testProd();
