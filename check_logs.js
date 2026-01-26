
const { createClient } = require('@supabase/supabase-js');

// Config from server.js
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createLogsTable() {
    console.log("Attempting to create logs table...");

    // Try to create via RPC if a generic SQL runner exists (unlikely but worth a try)
    // Or simply insert a log to see if it auto-creates? (Supabase doesn't usually do this).
    // If we can't create table via Client, we log that.

    try {
        // Check if table exists by selecting
        const { data, error } = await supabase.from('logs').select('*').limit(1);
        if (error) {
            console.error("Table check error:", error.message);
            if (error.message.includes('relation "public.logs" does not exist')) {
                console.log("Table definitely missing.");
                // We can't create with Anon key.
                console.log("ABORTING: Cannot create table with Anon key. User must run SQL.");
            }
        } else {
            console.log("Table exists!");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

createLogsTable();
