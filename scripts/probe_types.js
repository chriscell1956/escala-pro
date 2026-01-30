
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function probeTypes() {
    console.log("🔍 Reading Schema Types...");

    const { data, error } = await supabase.rpc('run_sql', {
        sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'alocacoes';"
    });

    // Fallback if RPC fails (which it did before)
    // We can't access info schema directly via client easily without RPC usually.
    // But we can try to infer from a failed insert error message which gives hints?
    // OR we try to insert a TEXT into 'vigilante_id' and see if it works.

    // TEST 1: Insert Text Matricula into vigilante_id
    console.log("🧪 Test 1: Insert Alloc with Text Matricula...");
    // Find a mat
    const { data: v } = await supabase.from('vigilantes').select('matricula').limit(1).single();
    if (v) {
        const payload = {
            vigilante_id: v.matricula, // TEXT
            data: '2026-01-10',
            setor: 'TEST_SETOR',
            campus: 'TEST_CAMPUS'
        };
        const { error: err1 } = await supabase.from('alocacoes').insert(payload);
        if (!err1) console.log("✅ Success! 'vigilante_id' accepts TEXT (Matricula).");
        else console.log("❌ Failed Text Insert:", err1.message);
    }

    // TEST 2: Insert UUID into vigilante_id (to see if it accepts that too or fails)
    const { data: v2 } = await supabase.from('vigilantes').select('id').limit(1).single();
    if (v2) {
        const payload2 = {
            vigilante_id: v2.id, // UUID
            data: '2026-01-11',
            setor: 'TEST_SETOR'
        };
        const { error: err2 } = await supabase.from('alocacoes').insert(payload2);
        if (!err2) console.log("✅ Success! 'vigilante_id' accepts UUID.");
        else console.log("❌ Failed UUID Insert:", err2.message);
    }
}

probeTypes();
