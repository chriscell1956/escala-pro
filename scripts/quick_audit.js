import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspect() {
    const tables = [
        "afastamentos", "alocacoes", "ferias", "horarios", "intervalos",
        "intervalos_log", "jornadas", "logs_sistema", "logs",
        "setor_jornada", "setores", "solicitacoes_folga", "usuarios", "vigilantes"
    ];

    for (const t of tables) {
        const { data, error } = await supabase.from(t).select("*").limit(1);
        if (error) {
            console.log(`TABLE [${t}]: NOT FOUND/ERROR (${error.message})`);
            continue;
        }
        const cols = data && data.length > 0 ? Object.keys(data[0]).join(", ") : "EMPTY";
        console.log(`TABLE [${t}]: ${cols}`);
    }
}

inspect();
