import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reusing credentials from LegacyAdapterController.js
const SUPABASE_URL = "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function backup() {
  console.log("Starting Backup...");

  // 1. Fetch all data raw
  const { data: vigilantes } = await supabase
    .from("vigilantes")
    .select("*, setor:setores(nome, campus)");
  const { data: alocacoes } = await supabase.from("alocacoes").select("*");
  const { data: setores } = await supabase.from("setores").select("*");

  const backupData = {
    timestamp: new Date().toISOString(),
    vigilantes_raw: vigilantes,
    alocacoes_raw: alocacoes,
    setores_raw: setores,
  };

  // 2. Also simulate the "Legacy Format" which is what we might use to restore or verify
  // We map manually here to ensure we capture the 'equipe_padrao' explicitly
  // Helper to map days
  const alocMap = new Map(); // vig_id -> [days]
  alocacoes.forEach((a) => {
    if (!alocMap.has(a.vigilante_id)) alocMap.set(a.vigilante_id, []);
    // Extract day from YYYY-MM-DD
    const day = parseInt(a.data.split("-")[2]);
    alocMap.get(a.vigilante_id).push(day);
  });

  const legacyCompatible = vigilantes.map((v) => {
    return {
      mat: v.matricula,
      nome: v.nome,
      eq: v.equipe_padrao, // CRITICAL: This is what we are "moving"
      setor: v.setor?.nome,
      campus: v.setor?.campus,
      dias: alocMap.get(v.id) || [], // Now we have the days!
    };
  });

  backupData.legacy_compatible_list = legacyCompatible;

  const outputPath = path.join(__dirname, "..", "backup_ers_full.json");
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2));

  console.log(`Backup saved to ${outputPath}`);
  console.log(
    `Counts: Vig=${vigilantes.length}, Aloc=${alocacoes.length}, Setor=${setores.length}`,
  );
}

backup();
