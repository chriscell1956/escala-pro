
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRpc() {
    console.log("Checking RPCs...");
    // Try a common name
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: "select 1" });
    if (error) console.log("RPC 'exec_sql' not found or failed:", error.message);
    else console.log("RPC 'exec_sql' WORKS!", data);

    const { data: d2, error: e2 } = await supabase.rpc('run_sql', { sql: "select 1" });
    if (e2) console.log("RPC 'run_sql' not found or failed:", e2.message);
    else console.log("RPC 'run_sql' WORKS!", d2);
}

checkRpc();
