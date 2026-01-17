import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// Configuração para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, "database.json");

// --- SUPABASE CLIENT (AUTH & DATA) ---
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzAyNTYsImV4cCI6MjA4NDAwNjI1Nn0.vMz38W2yVUGTSi0jnslvGQ1zj_I1bzsf_d3BH_u7Ahw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Middlewares ---
app.use(
  cors({
    origin: "*", // Permite qualquer origem (frontend)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "50mb" }));

// --- Helper: Database Management (Only for non-Auth stuff now) ---
async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    if (!data || data.trim() === "") {
      throw new Error("Empty file");
    }
    return JSON.parse(data);
  } catch (err) {
    if (
      err.code === "ENOENT" ||
      err instanceof SyntaxError ||
      err.message === "Empty file"
    ) {
      console.log(
        "⚠️ Banco de dados novo ou corrompido. Recriando database.json...",
      );
      // Only keeping logs and non-critical local storage here if needed.
      const initialDB = { schedules: {}, logs: {}, presets: [], overrides: {} };
      await fs.writeFile(DB_FILE, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    throw err;
  }
}

async function saveDB(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// --- Rotas de Sistema ---

app.get("/api/health", (req, res) => {
  res.json({ status: "online", mode: "cloud_supabase_auth" });
});

// --- Auth & User Management (VIA SUPABASE) ---

app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("usuarios").select("*");
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Erro users:", err);
    res.status(500).json({ error: "Erro ao ler usuários" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    // This endpoint might receive a full list or single update.
    // For Supabase, we prefer UPSERT on single or batch.
    // If frontend sends an array, we default to batch upsert.
    const users = req.body;
    if (!Array.isArray(users))
      return res.status(400).json({ error: "Formato inválido" });

    // Upsert based on Matricula
    const { error } = await supabase
      .from("usuarios")
      .upsert(users, { onConflict: "matricula" });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Erro saving users:", err.message);
    res.status(500).json({ error: "Erro ao salvar usuários" });
  }
});

app.post("/api/seed-users", async (req, res) => {
  try {
    const { vigilantes } = req.body;
    console.log("Seeding Users from Vigilantes list...");

    const ADMIN_MAT = "91611";

    // 1. Upsert Admin
    const adminUser = {
      matricula: ADMIN_MAT,
      nome: "CHRISTIANO R.G. DE OLIVEIRA",
      role: "MASTER",
      password: "123456",
      primeiro_acesso: true,
    };
    await supabase
      .from("usuarios")
      .upsert(adminUser, { onConflict: "matricula" });

    // 2. Batch others
    if (vigilantes && Array.isArray(vigilantes)) {
      const rows = vigilantes
        .filter((v) => v.mat !== ADMIN_MAT) // Skip admin duplicate
        .map((v) => ({
          matricula: v.mat,
          nome: v.nome,
          role: v.eq === "ADM" ? "MASTER" : "USER",
          password: "123456", // Default Password
          primeiro_acesso: true,
        }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from("usuarios")
          .upsert(rows, { onConflict: "matricula" });
        if (error) throw error;
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Seed Error:", err);
    res.status(500).json({ error: "Erro ao criar usuários" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { mat, password } = req.body;

    // Query Single User
    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("matricula", mat)
      .eq("password", password) // MVP: Plain Text check (Replace with Hash comp later)
      .single();

    if (error || !user) {
      return res
        .status(401)
        .json({ success: false, message: "Matrícula ou senha incorretos" });
    }

    // Return user info (strip password if possible, though currently retrieving all)
    const { password: _, ...safeUser } = user;

    // Normalize Role if needed? Frontend expects 'role' column which we have.

    res.json({
      success: true,
      user: safeUser,
      message: "Login realizado com sucesso",
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Erro no login" });
  }
});

// --- Schedule Routes ---

// --- Schedule Routes (RELATIONAL ADAPTER) ---
// Note: We still use the LegacyAdapterController which ALREADY connects to Supabase.
// So we just keep these routes.

import { LegacyAdapterController } from "./controllers/LegacyAdapterController.js";

// GET /api/escala/:month - Busca do Supabase Relacional e monta JSON legado
app.get("/api/escala/:month", LegacyAdapterController.getEscala);

// POST /api/escala/:month - Salva no Supabase Relacional (Upsert dias)
app.post("/api/escala/:month", LegacyAdapterController.saveEscala);

// --- Logs Routes (Can stay local JSON for now, or move to Supabase logs table later) ---
app.get("/api/logs/:month", async (req, res) => {
  try {
    const { month } = req.params;
    const db = await readDB();
    const key = `unoeste_logs_${month}`;
    if (!db.logs) db.logs = {};
    res.json(db.logs[key] || []);
  } catch (err) {
    res.status(500).json({ error: "Erro logs" });
  }
});

app.post("/api/logs/:month", async (req, res) => {
  try {
    const { month } = req.params;
    const newLog = req.body;
    const db = await readDB();
    const key = `unoeste_logs_${month}`;
    if (!db.logs) db.logs = {};
    if (!db.logs[key]) db.logs[key] = [];
    db.logs[key] = [newLog, ...db.logs[key]].slice(0, 200);
    await saveDB(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro logs" });
  }
});

// --- Presets & Overrides (Local JSON for config persistence simplicity for now) ---
// Ideally move to Supabase 'config' table in Phase 5
app.get("/api/presets", async (req, res) => {
  try {
    const db = await readDB();
    if (db.presets && db.presets.length > 0) {
      return res.json(db.presets);
    }
    // PROVISIONING FALLBACK (ERS):
    // Se não há presets salvos (Deploy limpo), gera a partir dos SETORES do banco.
    return await LegacyAdapterController.getDynamicPresets(req, res);
  } catch (e) {
    res.status(500).json({ error: "Erro presets" });
  }
});
app.post("/api/presets", async (req, res) => {
  try {
    const db = await readDB();
    db.presets = req.body;
    await saveDB(db);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erro presets" });
  }
});

app.get("/api/overrides", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.overrides || {});
  } catch (e) {
    res.status(500).json({ error: "Erro overrides" });
  }
});
app.post("/api/overrides", async (req, res) => {
  try {
    const db = await readDB();
    db.overrides = req.body;
    await saveDB(db);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erro overrides" });
  }
});

// --- LEGACY ADAPTER ROUTES ---
// GET /api/vigilantes - Retorna JSON idêntico ao antigo
app.get("/api/vigilantes", LegacyAdapterController.getVigilantes);
// POST /api/save - Salva dias trabalhados
app.post("/api/save", LegacyAdapterController.saveSchedule);

// Migrations
app.post("/api/migration/upload", LegacyAdapterController.importMigration);
app.post("/api/migration/from-url", LegacyAdapterController.importFromUrl);
app.post("/api/migration/direct", LegacyAdapterController.importFromLegacyDb);
app.get("/migration", (req, res) => {
  res.sendFile(path.join(__dirname, "migration_upload.html"));
});

app.listen(PORT, () => {
  console.log(`
    🚀 SERVIDOR BACKEND (SUPABASE AUTH) RODANDO!
    -----------------------------------
    📡 API:     http://localhost:${PORT}
    🔑 Auth:    Supabase ('usuarios' table)
    📂 Escala:  Supabase ('alocacoes' table)
    -----------------------------------
    `);
});
