import { readDB, saveDB } from './_db.js';

export default async function handler(req, res) {
    // Vercel processa query params automaticamente
    const { month, type } = req.query;

    if (!month) {
        return res.status(400).json({ error: "Mês não especificado" });
    }

    if (req.method === 'GET') {
        try {
            const db = await readDB();
            let key = `unoeste_pro_${month}`;
            if (type === 'draft') key += '_draft';
            
            const data = (db.schedules && db.schedules[key]) ? db.schedules[key] : null;
            res.status(200).json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    } else if (req.method === 'POST') {
        try {
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
            res.status(200).json({ success: true });
        } catch (err) {
            console.error("Erro ao salvar:", err);
            res.status(500).json({ error: "Erro ao salvar dados" });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
