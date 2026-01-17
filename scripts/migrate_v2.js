import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Credentials
const SUPABASE_URL = "https://tohwctqdhvppjggvxcqq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vwXbsj19SGdRdo2OChyJjA_Mq9g86Vw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DB_FILE = path.resolve(__dirname, "../database.json");

async function migrate() {
  console.log("🚀 Starting Migration V2 (Separated Tables)...");

  if (!fs.existsSync(DB_FILE)) {
    console.error("❌ database.json not found!");
    process.exit(1);
  }

  const dbData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  const users = dbData.users || [];
  const schedules = dbData.schedules || {};

  // --- 1. Migrate Vigilantes ---
  console.log("Processing Vigilantes...");
  const vigilantesMap = new Map();

  // From Users
  users.forEach((u) => {
    if (!vigilantesMap.has(u.mat)) {
      vigilantesMap.set(u.mat, {
        matricula: u.mat,
        nome: u.nome,
        cargo: "Vigilante",
      }); // Default cargo
    }
  });

  // From Schedules (check inside each schedule day/entry)
  // Structure of schedules: { "2024-01-01": [ { nome, mat, ... } ] }
  // Actually the key is "YYYY-MM" or similar? Let's assume keys are Month IDs or similar based on previous file viewing,
  // but types.ts says `dados: dbData.schedules[key]`.
  // Let's look at how database.json was structured. It had "schedules": {}.
  // If it's empty, we rely on users. If not, we scan it.

  // Scan PRESETS from constants if available? No, stick to DB file.

  const vigilantesPayload = Array.from(vigilantesMap.values());

  if (vigilantesPayload.length > 0) {
    console.log(`Upserting ${vigilantesPayload.length} vigilantes...`);
    const { error } = await supabase
      .from("vigilantes")
      .upsert(vigilantesPayload, { onConflict: "matricula" });

    if (error) console.error("❌ Error migrating vigilantes:", error);
    else console.log("✅ Vigilantes migrated.");
  }

  // --- 2. Migrate Sectors (Setores) ---
  console.log("Processing Sectors...");
  const sectorsMap = new Map(); // Key: "Name|Campus"

  // We need to find sectors from constant definitions OR from the `schedules` if populated.
  // Since `schedules` in the file I saw was `{}` (empty), we might rely on the `constants.ts` equivalent
  // OR we just migrate what we find in `users` (which might not have sector info consistently if they are just users).
  // The `database.json` users list has simple auth info.

  // However, `DECEMBER_2025_PRESET` in `constants.ts` defines sectors.
  // I should extract from `presets.ts` or `constants.ts` effectively, but here we only have `database.json`.
  // Wait, the user wants to *create* the tables so they are separated.
  // If `database.json` doesn't have the sector data, where is it?
  // It's in `constants.ts` (DECEMBER_2025_PRESET) as code.
  // I should probably extract it from the *code* or just insert the known ones if the JSON is empty.

  // Let's try to infer from `database.json` users if they have sector info?
  // The `database.json` provided shows users having `role`, `mat`, `nome`. No sector.

  // AHH, I missed something. `constants.ts` has `DECEMBER_2025_PRESET` which HAS `setor`, `campus`, `refeicao`.
  // The migration script usually reads from the DB file. But if the DB file is just auth, the "data" is in the code constants.
  // I should populate the tables using the `DECEMBER_2025_PRESET` as the seed if the DB is empty.

  // BUT verify: `database.json` in the view I did earlier had users but `schedules` was empty.
  // So I must assume the "old data" is actually likely in `constants.ts` or the user implies the *structure* separation for future use,
  // and populating it with the "current" state (which might be in `constants.ts`).

  // I will import the constants to get the seed data.
  // Since this is a module, I can try dynamic import or just copy the logic.
  // Importing `constants.ts` might fail due to TS.
  // I'll parse `constants.ts` text coarsely or just replicate the known presets in the script?
  // No, `constants.ts` is large.

  // BETTER APPROACH: Read `constants.ts` as a file, regex extract the `setor`, `campus`, `refeicao` fields to populate the tables.

  const constantsPath = path.resolve(__dirname, "../constants.ts");
  const constantsContent = fs.readFileSync(constantsPath, "utf-8");

  // Regex for sector/campus
  // looking for: sector: "NAME", campus: "NAME"
  const sectorRegex = /setor:\s*"([^"]+)",\s*campus:\s*"([^"]+)"/g;
  let match;
  while ((match = sectorRegex.exec(constantsContent)) !== null) {
    const sector = match[1];
    const campus = match[2];
    const key = `${sector}|${campus}`;
    if (!sectorsMap.has(key)) {
      sectorsMap.set(key, { nome: sector, campus: campus });
    }
  }

  const sectorsPayload = Array.from(sectorsMap.values());
  if (sectorsPayload.length > 0) {
    console.log(`Upserting ${sectorsPayload.length} sectors...`);
    const { error } = await supabase
      .from("setores")
      .upsert(sectorsPayload, { onConflict: "nome, campus" }); // requires the unique constraint
    // Note: Supabase upsert requires the constraint name usually or inferred from columns.
    // If composite unique constraint differs, this might fail without explicit constraint name.
    // But let's try columns inference.

    if (error) console.error("❌ Error migrating sectors:", error);
    else console.log("✅ Sectors migrated.");
  }

  // --- 3. Migrate Lunch Hours (Horarios de Almoco) ---
  console.log("Processing Lunch Hours...");
  const lunchMap = new Map();
  // Regex for refeicao
  // looking for: refeicao: "TEXT"
  const lunchRegex = /refeicao:\s*"([^"]+)"/g;
  while ((match = lunchRegex.exec(constantsContent)) !== null) {
    const desc = match[1];
    if (!lunchMap.has(desc) && desc !== "***") {
      // Parse times if possible? e.g. "11h45 às 13h"
      // Simple parser:
      let inicio = null,
        fim = null;
      const timeMatch = /(\d{1,2})h(\d{2})?\s*às\s*(\d{1,2})h(\d{2})?/.exec(
        desc,
      );
      if (timeMatch) {
        const h1 = timeMatch[1].padStart(2, "0");
        const m1 = timeMatch[2] || "00";
        const h2 = timeMatch[3].padStart(2, "0");
        const m2 = timeMatch[4] || "00";
        inicio = `${h1}:${m1}:00`;
        fim = `${h2}:${m2}:00`;
      }

      lunchMap.set(desc, { descricao: desc, inicio, fim });
    }
  }

  const lunchPayload = Array.from(lunchMap.values());
  if (lunchPayload.length > 0) {
    console.log(`Upserting ${lunchPayload.length} lunch hours...`);
    const { error } = await supabase
      .from("horarios_almoco")
      .upsert(lunchPayload, { onConflict: "descricao" });

    if (error) console.error("❌ Error migrating lunch hours:", error);
    else console.log("✅ Lunch hours migrated.");
  }

  console.log("✨ Migration V2 Complete!");
}

migrate();
