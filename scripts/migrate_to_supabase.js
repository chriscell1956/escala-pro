import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Credentials from services/api.ts
const SUPABASE_URL = "https://tohwctqdhvppjggvxcqq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vwXbsj19SGdRdo2OChyJjA_Mq9g86Vw";
const TABLE = "escalas";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DB_FILE = path.resolve(__dirname, "../database.json");

async function migrate() {
  console.log("🚀 Starting Migration to Supabase...");

  if (!fs.existsSync(DB_FILE)) {
    console.error("❌ database.json not found!");
    process.exit(1);
  }

  const dbData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));

  // 1. Migrate Users
  if (dbData.users && Array.isArray(dbData.users)) {
    console.log(`👤 Migrating ${dbData.users.length} users...`);
    const { error } = await supabase
      .from(TABLE)
      .upsert({ nome: "users", dados: dbData.users }, { onConflict: "nome" });

    if (error) console.error("❌ Error migrating users:", error);
    else console.log("✅ Users migrated.");
  }

  // 2. Migrate Schedules
  if (dbData.schedules) {
    const keys = Object.keys(dbData.schedules);
    console.log(`📅 Migrating ${keys.length} schedule entries...`);

    for (const key of keys) {
      console.log(`   - Uploading ${key}...`);
      const { error } = await supabase
        .from(TABLE)
        .upsert(
          { nome: key, dados: dbData.schedules[key] },
          { onConflict: "nome" },
        );

      if (error) console.error(`❌ Error migrating ${key}:`, error);
    }
    console.log("✅ Schedules migrated.");
  }

  // 3. Migrate Logs
  if (dbData.logs) {
    const keys = Object.keys(dbData.logs);
    console.log(`📜 Migrating ${keys.length} log entries...`);

    for (const key of keys) {
      console.log(`   - Uploading log ${key}...`);
      const { error } = await supabase
        .from(TABLE)
        .upsert({ nome: key, dados: dbData.logs[key] }, { onConflict: "nome" });

      if (error) console.error(`❌ Error migrating log ${key}:`, error);
    }
    console.log("✅ Logs migrated.");
  }

  console.log("✨ Migration Complete!");
}

migrate();
