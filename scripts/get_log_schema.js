import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getSchema() {
    console.log("🚀 Lendo esquema de 'logs_sistema'...");

    // Tenta via rpc generic (se existir)
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'logs_sistema' ORDER BY ordinal_position;"
    });

    if (error) {
        console.error("❌ Erro RPC:", error.message);
        console.log("💡 Tentando via seleção direta de 1 linha...");
        const { data: sample, error: errS } = await supabase.from('logs_sistema').select('*').limit(1);
        if (sample && sample.length > 0) {
            console.log("✅ Colunas encontradas:", Object.keys(sample[0]));
        } else {
            console.log("⚠️ Tabela vazia e sem RPC. Vou assumir o padrão do sistema anterior.");
        }
    } else {
        console.log("✅ Esquema:", data);
    }
}

getSchema();
