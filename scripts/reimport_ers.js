import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LegacyAdapterController } from "../controllers/LegacyAdapterController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log("Reading backup file...");
  const backupPath = path.join(__dirname, "..", "backup_ers_full.json");
  const backupData = JSON.parse(fs.readFileSync(backupPath, "utf-8"));

  // Use the "legacy_compatible_list" we created, which has 'eq'
  const vigilantes = backupData.legacy_compatible_list;

  console.log(
    `Sending ${vigilantes.length} vigilantes to migration Controller (Direct)...`,
  );

  const mockReq = { body: { vigilantes } };
  const mockRes = {
    json: (data) =>
      console.log("Migration Result:", JSON.stringify(data, null, 2)),
    status: (code) => ({
      json: (data) => console.error(`Error ${code}:`, data),
    }),
  };

  try {
    await LegacyAdapterController.importMigration(mockReq, mockRes);
  } catch (e) {
    console.error("Migration Failed:", e);
  }
}

runMigration();
