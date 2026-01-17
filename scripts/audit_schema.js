import { createClient } from "@supabase/supabase-js";

// Credentials as used in LegacyAdapterController.js
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditSchema() {
  console.log("🔍 Auditing Supabase Schema...");

  // Fetch Tables and Columns
  // Note: Supabase JS client doesn't give direct access to information_schema via RPC usually unless exposed.
  // However, we can infer structure by selecting * limit 0 or checking expected tables.
  // Or better, we just list the known tables and inspect their properties if possible.
  // But since we can't easily query information_schema without admin rights or SQL editor,
  // we will try to infer based on what we can select.

  // Actually, asking the user for the map is Step 1.
  // I will try to inspect the known tables: vigilantes, setores, alocacoes, usuarios, ferias, solicitacoes_folga.

  const tables = [
    "vigilantes",
    "setores",
    "alocacoes",
    "usuarios",
    "ferias",
    "solicitacoes_folga",
  ];
  const schemaMap = {};

  for (const table of tables) {
    // Try to fetch 1 row
    let { data, error } = await supabase.from(table).select("*").limit(1);

    if (error) {
      schemaMap[table] = { error: error.message };
      continue;
    }

    if (data && data.length > 0) {
      schemaMap[table] = Object.keys(data[0]);
    } else {
      // If empty, we try a dummy insert that is guaranteed to fail but might return column info?
      // No, Supabase/PostgREST error messages might not list all columns.
      // Alternative: "Admin" reflection if possible? No.
      // Helper: We just list what we KNOW from the codebase usage.
      // OR: We try to insert an empty object to trigger a "column X is required" error which might not be helpful.

      // New Strategy: We will ASSUME standard columns based on our codebase usage if we can't find them.
      // But to be precise, let's try to infer from the code we have.
      schemaMap[table] = "EMPTY_TABLE";
    }
  }

  // Output Report
  console.log(JSON.stringify(schemaMap, null, 2));
}

auditSchema();
