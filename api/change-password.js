import { readDB, saveDB } from './_db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { mat, newPassword } = req.body;
        const db = await readDB();
        
        if (!db.users) db.users = [];
        const userIdx = db.users.findIndex(u => u.mat === mat);
        
        if (userIdx > -1) {
            db.users[userIdx].password = newPassword;
            await saveDB(db);
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "Usuário não encontrado" });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro ao trocar senha" });
    }
}