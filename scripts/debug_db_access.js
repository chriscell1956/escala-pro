
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugAccess() {
    console.log("🛠️ Debugging DB Access & Structure...");

    // 1. Check Vigilantes Count
    const { count, error: errCount } = await supabase.from('vigilantes').select('*', { count: 'exact', head: true });
    if (errCount) console.error("❌ Failed to count Vigilantes:", errCount.message);
    else console.log(`✅ Vigilantes Count: ${count}`);

    // 2. Try to Insert Dummy Vigilante (to check permissions/constraints)
    const dummyMat = "DEBUG_99999";
    console.log("Testing Insert Vigilante...");
    const { data: vData, error: vErr } = await supabase.from('vigilantes').upsert({
        matricula: dummyMat,
        nome: "Debug User",
        equipe_padrao: "A"
    }).select().single();

    if (vErr) {
        console.error("❌ Vigilante Insert Failed:", vErr.message);
    } else {
        console.log("✅ Vigilante Insert OK. ID:", vData.id);

        // 3. Try to Insert Allocations for this Vigilante
        console.log("Testing Insert Alocacao (Integer ID Check)...");
        // We assume 'data' is DATE, 'tipo' is TEXT. 
        // We DO NOT send 'id'. If ID is serial, it works. If ID is UUID and no default, it fails.
        // We verify the ID type by the returned data.

        const { data: aData, error: aErr } = await supabase.from('alocacoes').insert({
            vigilante_id: vData.id,
            data: "2026-01-01",
            tipo: "TESTE_DEBUG"
        }).select();

        if (aErr) {
            console.error("❌ Alocacao Insert Failed:", aErr.message);
        } else {
            console.log("✅ Alocacao Insert OK.", aData);
            if (aData && aData.length > 0) {
                console.log("   Observed 'id' type:", typeof aData[0].id, "Value:", aData[0].id);

                // Cleanup Alocacao
                await supabase.from('alocacoes').delete().eq('id', aData[0].id);
            }
        }

        // Cleanup Vigilante
        await supabase.from('vigilantes').delete().eq('matricula', dummyMat);
    }
}

debugAccess();
