import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    console.log("--- DIAGNÓSTICO DE TABELAS DE LOG ---");

    // 1. Tentar ler de logs_sistema via view-hinting
    const { data, error } = await supabase.from('logs_sistema').select('*').limit(0);
    if (error) {
        console.log("Erro ao ler logs_sistema:", error.message);
    } else {
        console.log("Tabela 'logs_sistema' encontrada.");
    }

    // 2. Tentar ver colunas via RPC de inspeção (se existir)
    const { data: cols, error: errC } = await supabase.rpc('inspect_columns', { table_name: 'logs_sistema' });
    if (errC) {
        // Se falhar RPC, tenta via query simulada
        console.log("RPC falhou. Tentando insert simulado para ver campos obrigatórios...");
        const { error: errI } = await supabase.from('logs_sistema').insert([{ invalid_col: 1 }]);
        console.log("Erro de insert (pode revelar colunas):", errI?.message);
    } else {
        console.log("Colunas via RPC:", cols);
    }
}

diagnose();
