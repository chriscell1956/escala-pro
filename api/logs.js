import { readDB, saveDB } from './_db.js';

export default async function handler(req, res) {
    const { month } = req.query;

    if (!month) {
        return res.status(400).json({ error: "Mês não especificado" });
    }

    if (req.method === 'GET') {
        try {
            const db = await readDB();
            const key = `unoeste_logs_${month}`;
            const data = (db.logs && db.logs[key]) ? db.logs[key] : [];
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: "Erro ao ler logs" });
        }
    } else if (req.method === 'POST') {
        try {
            const newLogs = req.body;
            
            if (!newLogs || !Array.isArray(newLogs)) {
                return res.status(400).json({ error: "Dados de log inválidos" });
            }

            const db = await readDB();
            const key = `unoeste_logs_${month}`;
            
            if (!db.logs) db.logs = {};
            db.logs[key] = newLogs;
            
            await saveDB(db);
            res.status(200).json({ success: true });
        } catch (err) {
            res.status(500).json({ error: "Erro ao salvar logs" });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}