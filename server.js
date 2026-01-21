import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { LegacyAdapterController } from "./controllers/LegacyAdapterController.js";

const app = express();
const PORT = process.env.PORT || 3001;

// --- SUPABASE CLIENT (AUTH & DATA) ---
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://uiqelqgurmczmrsdeipn.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- IN-MEMORY STORAGE (Volatile - Reset on Deploy) ---
// Substitui o antigo database.json para evitar erros de leitura/escrita na Vercel (ReadOnly)
const memoryDB = {
  presets: [],
  overrides: {},
};

// --- Middlewares ---
app.use(
  cors({
    origin: "*", // Permite qualquer origem (frontend)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "50mb" }));

// --- Rotas de Sistema ---

app.get("/api/health", (req, res) => {
  res.json({ status: "online", mode: "production_memory_db" });
});

// --- Auth & User Management (VIA SUPABASE) ---

app.get("/api/users", async (req, res) => {
  try {
    const { data: users, error } = await supabase.from("usuarios").select("*");
    if (error) throw error;

    // Workaround: 'usuarios' table missing 'nome' column. Fetch from 'vigilantes'.
    const { data: vigs } = await supabase
      .from("vigilantes")
      .select("matricula, nome");
    const vigMap = new Map();
    if (vigs) vigs.forEach((v) => vigMap.set(v.matricula, v.nome));

    const usersWithNames = users.map((u) => ({
      ...u,
      nome: u.nome || vigMap.get(u.matricula) || "Sem Nome",
    }));

    res.json(usersWithNames);
  } catch (err) {
    console.error("Erro users:", err);
    res.status(500).json({ error: "Erro ao ler usuários" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const users = req.body;
    if (!Array.isArray(users))
      return res.status(400).json({ error: "Formato inválido" });

    // Upsert based on Matricula. OMIT 'nome' as table lacks it.
    const usersToUpsert = users.map((u) => {
      const { nome, ...rest } = u;
      return rest;
    });
    const { error } = await supabase
      .from("usuarios")
      .upsert(usersToUpsert, { onConflict: "matricula" });

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
    const masterUser = {
      matricula: ADMIN_MAT,
      role: "MASTER",
      senha: "123456",
      primeiro_acesso: true,
    };
    await supabase
      .from("usuarios")
      .upsert(masterUser, { onConflict: "matricula" });

    // 2. Batch others
    if (vigilantes && Array.isArray(vigilantes)) {
      const rows = vigilantes
        .filter((v) => v.mat !== ADMIN_MAT) // Skip admin duplicate
        .map((v) => ({
          matricula: v.mat,
          role: v.eq === "ADM" ? "MASTER" : "USER",
          senha: "123456", // Default Password
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
    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("matricula", mat)
      .eq("senha", password)
      .single();

    if (error || !user) {
      return res
        .status(401)
        .json({ success: false, message: "Matrícula ou senha incorretos" });
    }

    const { password: _, ...safeUser } = user;

    if (!safeUser.nome) {
      const { data: vig } = await supabase
        .from("vigilantes")
        .select("nome")
        .eq("matricula", mat)
        .single();
      if (vig && vig.nome) safeUser.nome = vig.nome;
    }

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

// --- Schedule Routes (RELATIONAL ADAPTER) ---
// GET /api/escala/:month - Busca do Supabase Relacional e monta JSON legado
app.get("/api/escala/:month", LegacyAdapterController.getEscala);
// POST /api/escala/:month - Salva no Supabase Relacional (Upsert dias)
app.post("/api/escala/:month", LegacyAdapterController.saveEscala);

// --- Logs Routes (MIGRATED TO SUPABASE) ---
app.get("/api/logs/:month", async (req, res) => {
  try {
    // Just fetching latest logs 200
    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(200);

    if (error) throw error;

    // DB: id, timestamp, action, user_name, details, target_item_id
    // Frontend: id, timestamp, user, action, details, targetName
    const formatted = data.map((l) => ({
      id: l.id?.toString(),
      timestamp: l.timestamp ? new Date(l.timestamp).getTime() : Date.now(),
      user: l.user_name || "Sistema",
      action: l.action,
      details: l.details,
      targetName: l.target_item_id,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Logs GET error:", err);
    res.status(500).json({ error: "Erro logs" });
  }
});

app.post("/api/logs/:month", async (req, res) => {
  try {
    const newLog = req.body;
    // Frontend: { id, timestamp, user, action, details, targetName }

    const dbLog = {
      action: newLog.action,
      user_name: newLog.user,
      details: newLog.details,
      target_item_id: newLog.targetName,
      timestamp: new Date(newLog.timestamp || Date.now()).toISOString(),
    };

    const { error } = await supabase.from("logs").insert(dbLog);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("Logs POST error:", err);
    res.status(500).json({ error: "Erro logs" });
  }
});

// --- MAINTENANCE ROUTES ---
app.post("/api/maintenance/wipe-schedule", async (req, res) => {
  try {
    console.log("🧹 LIMPEZA TOTAL DA ESCALA INICIADA...");
    const { error } = await supabase
      .from("alocacoes")
      .delete()
      .not("id", "is", null);

    if (error) throw error;

    console.log("✅ Tabela alocacoes limpa com sucesso.");
    res.json({ success: true, message: "Escala zerada com sucesso." });
  } catch (e) {
    console.error("Erro ao limpar escala:", e);
    res.status(500).json({ error: "Erro ao limpar escala" });
  }
});

// --- Presets & Overrides (IN-MEMORY NOW) ---
app.get("/api/presets", async (req, res) => {
  try {
    if (memoryDB.presets && memoryDB.presets.length > 0) {
      return res.json(memoryDB.presets);
    }
    // Fallback: Gerar dinâmico se a memória estiver vazia
    return await LegacyAdapterController.getDynamicPresets(req, res);
  } catch (e) {
    res.status(500).json({ error: "Erro presets" });
  }
});
app.post("/api/presets", async (req, res) => {
  try {
    memoryDB.presets = req.body;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erro presets" });
  }
});

app.get("/api/overrides", async (req, res) => {
  res.json(memoryDB.overrides || {});
});
app.post("/api/overrides", async (req, res) => {
  try {
    memoryDB.overrides = req.body;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erro overrides" });
  }
});

// --- LEGACY ADAPTER ROUTES ---
app.get("/api/vigilantes", LegacyAdapterController.getVigilantes);
app.post("/api/save", LegacyAdapterController.saveSchedule);

// Migrations
app.post("/api/migration/upload", LegacyAdapterController.importMigration);

app.listen(PORT, () => {
  console.log(`
    🚀 SERVIDOR BACKEND RODANDO!
    -----------------------------------
    📡 API:     http://localhost:${PORT}
    🔑 Auth:    Supabase ('usuarios')
    📂 Storage: Supabase ('logs', 'alocacoes') + Memória (Presets)
    ❌ JSON:    Desativado (database.json removido)
    -----------------------------------
    `);
});

export default app;
