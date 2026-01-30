
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listColumns() {
    console.log("🔍 Probing Table Columns...");

    // 1. Vigilantes
    const { data: vData, error: vErr } = await supabase.from('vigilantes').select('*').limit(1);
    if (vErr) console.error("❌ Vigilantes Error:", vErr.message);
    else if (vData.length === 0) console.log("⚠️ Vigilantes table is empty.");
    else console.log("✅ Vigilantes Cols:", JSON.stringify(Object.keys(vData[0])));

    // 2. Alocacoes (Probe 'equipe')
    const { data: aData, error: aErr } = await supabase.from('alocacoes').select('*').limit(1);
    if (aErr) console.error("❌ Alocacoes Error:", aErr.message);
    else if (!aData || aData.length === 0) {
        console.log("⚠️ Alocacoes is empty. Probing 'equipe' column...");
        const { data: vig } = await supabase.from('vigilantes').select('id').limit(1).single();
        if (vig) {
            const dummy = {
                vigilante_id: vig.id,
                data: '2026-01-05',
                equipe: 'TEST_COL'
            };
            const { error: insErr } = await supabase.from('alocacoes').insert(dummy);
            if (insErr) {
                console.error("❌ Insert 'equipe' Error:", insErr.message);
                console.log("⚠️ TRYING WITHOUT TEAM COLUMN (Just ID/Date/Setor) to confirm baseline...");

                const dummy2 = { vigilante_id: vig.id, data: '2026-01-06' };
                const { error: err2 } = await supabase.from('alocacoes').insert(dummy2);
                if (err2) console.error("❌ Insert BARE Error:", err2.message);
                else console.log("✅ Insert BARE Success! (Alocacoes has NO Team Column??)");
            }
            else console.log("✅ Insert 'equipe' Success! Column is 'equipe'.");
        }
    }
    else {
        console.log("✅ Alocacoes Cols (Found Row):", JSON.stringify(Object.keys(aData[0])));
    }
}

listColumns();
