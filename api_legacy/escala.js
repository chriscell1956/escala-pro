import { readDB, saveDB } from "./_db.js";

export default async function handler(req, res) {
  // Vercel processa query params automaticamente
  const { month, type } = req.query;

  if (!month) {
    return res.status(400).json({ error: "Mês não especificado" });
  }

  if (req.method === "GET") {
    try {
      const db = await readDB();
      let key = `unoeste_pro_${month}`;
      if (type === "draft") key += "_draft";

      const data = db.schedules && db.schedules[key] ? db.schedules[key] : null;
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  } else if (req.method === "POST") {
    try {
      const newData = req.body;

      if (!newData || !Array.isArray(newData)) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const db = await readDB();
      let key = `unoeste_pro_${month}`;
      if (type === "draft") key += "_draft";

      if (!db.schedules) db.schedules = {};
      db.schedules[key] = newData;

      await saveDB(db);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      res.status(500).json({ error: "Erro ao salvar dados" });
    }
  } else if (req.method === "DELETE") {
    const { mat, scope } = req.query; // scope: 'this', 'future', 'all'

    if (!mat) return res.status(400).json({ error: "Matrícula não informada" });

    try {
      const db = await readDB();
      if (!db.schedules) db.schedules = {};

      const targetMonth = parseInt(month);
      let changed = false;

      Object.keys(db.schedules).forEach((key) => {
        const parts = key.split("_");
        // Formato esperado: unoeste_pro_202501 ou unoeste_pro_202501_draft
        const keyMonthStr = parts[2];
        if (!keyMonthStr || isNaN(keyMonthStr)) return;

        const keyMonth = parseInt(keyMonthStr);
        let shouldDelete = false;

        if (scope === "all") {
          shouldDelete = true;
        } else if (scope === "future") {
          if (keyMonth >= targetMonth) shouldDelete = true;
        } else {
          // scope === 'this'
          if (keyMonth === targetMonth) shouldDelete = true;
        }

        if (shouldDelete && Array.isArray(db.schedules[key])) {
          const originalLen = db.schedules[key].length;
          const filtered = db.schedules[key].filter(
            (v) => String(v.mat).trim() !== String(mat).trim(),
          );
          if (filtered.length !== originalLen) {
            db.schedules[key] = filtered;
            changed = true;
          }
        }
      });

      if (changed) await saveDB(db);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Erro ao excluir:", err);
      res.status(500).json({ error: "Erro ao excluir dados" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
