
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env file to avoid dotenv dependency issues if not installed
const supabaseUrl = "https://uiqelqgurmczmrsdeipn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env or .env.local");
    // Fallback try to match strict format
    // console.log("Env loaded:", process.env);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("🔍 Checking Database...");

    // Check Vigilantes (Profiles) - Sample and Columns
    const { data: sampleVigs, error: errV } = await supabase
        .from('vigilantes')
        .select('*')
        .limit(1);

    if (errV) console.error("Error checking vigilantes:", errV);
    else {
        console.log("ℹ️ Vigilante Table Columns:", Object.keys(sampleVigs[0] || {}));
        console.log("ℹ️ Sample Vigilante Profile:", sampleVigs[0]);
    }

    // Check Vigilantes (Profiles) - Total Count
    const { count: countVig, error: errVig } = await supabase
        .from('vigilantes')
        .select('*', { count: 'exact', head: true });

    if (errVig) console.error("Error checking vigilantes:", errVig);
    else console.log(`👥 Total Vigilantes (Profiles): ${countVig}`);

    // Check Users
    const { data: users, error: errU } = await supabase
        .from('usuarios')
        .select('matricula, perfil');

    if (errU) console.error("Error checking users:", errU);
    else {
        console.log(`👤 Total Users: ${users?.length || 0}`);
        users.forEach(u => console.log(` - User Mat: ${u.matricula}, Perfil: ${u.perfil}`));
    }


    // Check Allocations (Jan 2026)
    const { count: countAlloc, error: errAlloc } = await supabase
        .from('alocacoes')
        .select('*', { count: 'exact', head: true })
        .gte('data', '2026-01-01')
        .lte('data', '2026-01-31');

    if (errAlloc) console.error("Error checking allocations Jan 2026:", errAlloc);
    else console.log(`📅 Jan 2026 Allocations (by Data): ${countAlloc}`);

    // Check Allocations (Total)
    const { count: countTotal, error: errTotal } = await supabase
        .from('alocacoes')
        .select('*', { count: 'exact', head: true });

    if (errTotal) console.error("Error checking total allocations:", errTotal);
    else console.log(`📅 Total Allocations in DB: ${countTotal}`);

    // Check Users Schema
    const { data: sampleUsers, error: errUS } = await supabase
        .from('usuarios')
        .select('*')
        .limit(1);

    if (errUS) console.error("Error checking usuarios schema:", errUS);
    else {
        console.log("ℹ️ Users Table Columns:", Object.keys(sampleUsers[0] || {}));
        console.log("ℹ️ Sample User:", sampleUsers[0]);
    }

    const { data: master, error: errM } = await supabase
        .from('usuarios')
        .select('*')
        .eq('matricula', '91611')
        .single();

    if (errM) console.error("Error finding Master user:", errM);
    else console.log("✅ Master User Found:", master);
}

check();
