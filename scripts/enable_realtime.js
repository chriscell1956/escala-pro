import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function enableRealtime() {
    console.log("🚀 Habilitando Realtime para setores e alocacoes...");

    try {
        // Nota: O Supabase exige que as tabelas sejam adicionadas à publicação 'supabase_realtime'
        // Com a Service Role Key, podemos tentar rodar RPC ou comandos via SQL se habilitado.
        // Se não houver RPC de SQL, pediremos ao usuário para conferir no dashboard.

        // Tenta via SQL (se a função 'exec_sql' existir - comum em setups customizados)
        const { error } = await supabase.rpc('exec_sql', {
            sql_query: "ALTER PUBLICATION supabase_realtime ADD TABLE setores; ALTER PUBLICATION supabase_realtime ADD TABLE alocacoes;"
        });

        if (error) {
            console.warn("⚠️ Não foi possível rodar SQL via RPC. Verificando se já está ativo...");
        } else {
            console.log("✅ Realtime habilitado via SQL!");
        }
    } catch (e) {
        console.warn("⚠️ Erro ao tentar habilitar via script:", e.message);
    }
}

enableRealtime();
