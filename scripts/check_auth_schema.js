import { createClient } from "@supabase/supabase-js";

// Hardcoded for this verification script - in production use Env Vars
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAuthSchema() {
  console.log("Checking 'usuarios' table...");

  // 1. Check if table exists (by selecting 1 row)
  const { data, error } = await supabase.from("usuarios").select("*").limit(1);

  if (error) {
    console.error("❌ Error accessing 'usuarios':", error.message);
    console.log("Attempting to CREATE table via SQL...");

    // MVP: We cannot run DDL via client easily unless we have specific functions or permissions.
    // We will output the recommended SQL for the user if it fails.
    console.log(`
        run this SQL in Supabase Dashboard:
        
        CREATE TABLE IF NOT EXISTS public.usuarios (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            matricula text UNIQUE NOT NULL,
            nome text NOT NULL,
            role text DEFAULT 'USER',
            password text NOT NULL, -- MVP: Simple storage
            primeiro_acesso boolean DEFAULT true,
            created_at timestamptz DEFAULT now()
        );
        `);
    return;
  }

  console.log("✅ Table 'usuarios' exists.");
  if (data.length > 0) {
    console.log("Sample user:", data[0]);
  } else {
    console.log("Table is empty.");
  }
}

checkAuthSchema();
