
import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'database.json');

// --- Middlewares ---
app.use(cors({
    origin: '*', // Permite qualquer origem (frontend)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); 

// --- Helper: Database Management ---
async function readDB() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        if (!data || data.trim() === '') {
            throw new Error('Empty file');
        }
        return JSON.parse(data);
    } catch (err) {
        // Se arquivo não existe ou está corrompido (JSON inválido), recria
        if (err.code === 'ENOENT' || err instanceof SyntaxError || err.message === 'Empty file') {
            console.log("⚠️ Banco de dados novo ou corrompido. Recriando database.json...");
            const initialDB = { users: [], schedules: {}, logs: {} };
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

app.get('/api/health', (req, res) => {
    res.json({ status: 'online', mode: 'filesystem_db' });
});

// --- Auth & User Management ---

app.get('/api/users', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.users || []);
    } catch (err) {
        console.error("Erro users:", err);
        res.status(500).json({ error: "Erro ao ler usuários" });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const newUsersList = req.body;
        if (!Array.isArray(newUsersList)) return res.status(400).json({ error: "Formato inválido" });
        
        const db = await readDB();
        db.users = newUsersList;
        await saveDB(db);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Erro ao salvar usuários" });
    }
});

app.post('/api/seed-users', async (req, res) => {
    try {
        const { vigilantes } = req.body;
        const db = await readDB();
        
        let added = 0;
        if (!db.users) db.users = [];

        const adminMat = '91611';
        let adminUser = db.users.find(u => u.mat === adminMat);
        if (!adminUser) {
            db.users.push({
                mat: adminMat,
                nome: "CHRISTIANO R.G. DE OLIVEIRA",
                role: 'MASTER',
                password: '123456'
            });
            added++;
        }

        if (vigilantes && Array.isArray(vigilantes)) {
            vigilantes.forEach(vig => {
                const exists = db.users.find(u => u.mat === vig.mat);
                if (!exists && vig.mat !== adminMat) {
                    db.users.push({
                        mat: vig.mat,
                        nome: vig.nome,
                        role: vig.eq === 'ADM' ? 'MASTER' : 'USER',
                        password: '123456'
                    });
                    added++;
                }
            });
        }

        if (added > 0) await saveDB(db);
        res.json({ success: true, added });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao criar usuários" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { mat, password } = req.body;
        const db = await readDB();
        
        if (mat === '91611' && password === '123456') {
             return res.json({ 
                success: true, 
                user: { mat: '91611', nome: 'CHRISTIANO R.G. DE OLIVEIRA', role: 'MASTER' },
                message: "Acesso Admin (Local)"
            });
        }

        const user = (db.users || []).find(u => u.mat === mat && u.password === password);
        
        if (user) {
            const { password, ...safeUser } = user;
            res.json({ success: true, user: safeUser });
        } else {
            res.status(401).json({ success: false, message: "Matrícula ou senha incorretos" });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro no login" });
    }
});

// --- Schedule Routes ---

app.get('/api/escala/:month', async (req, res) => {
    try {
        const { month } = req.params;
        const { type } = req.query;
        
        const db = await readDB();
        let key = `unoeste_pro_${month}`;
        if (type === 'draft') key += '_draft';

        if (!db.schedules) db.schedules = {};
        const data = db.schedules[key] || null;
        res.json(data);
    } catch (err) {
        console.error("Erro ao ler escala:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

app.post('/api/escala/:month', async (req, res) => {
    try {
        const { month } = req.params;
        const { type } = req.query;
        const newData = req.body;
        
        if (!newData || !Array.isArray(newData)) {
            return res.status(400).json({ error: "Dados inválidos" });
        }

        const db = await readDB();
        let key = `unoeste_pro_${month}`;
        if (type === 'draft') key += '_draft';
        
        if (!db.schedules) db.schedules = {};
        db.schedules[key] = newData;
        
        await saveDB(db);
        res.json({ success: true });
    } catch (err) {
        console.error("Erro ao salvar escala:", err);
        res.status(500).json({ error: "Erro ao salvar dados" });
    }
});

// --- Logs Routes ---

app.get('/api/logs/:month', async (req, res) => {
    try {
        const { month } = req.params;
        const db = await readDB();
        const key = `unoeste_logs_${month}`;
        
        if (!db.logs) db.logs = {};
        res.json(db.logs[key] || []);
    } catch (err) {
        res.status(500).json({ error: "Erro ao ler logs" });
    }
});

app.post('/api/logs/:month', async (req, res) => {
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
        res.status(500).json({ error: "Erro ao salvar log" });
    }
});

app.listen(PORT, () => {
    console.log(`
    🚀 SERVIDOR LOCAL RODANDO!
    -----------------------------------
    📡 URL:     http://localhost:${PORT}
    📂 Banco:   ${DB_FILE}
    -----------------------------------
    `);
});
