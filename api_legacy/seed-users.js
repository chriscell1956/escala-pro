import { readDB, saveDB } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { vigilantes } = req.body;
    const db = await readDB();

    let added = 0;
    if (!db.users) db.users = [];

    if (vigilantes && Array.isArray(vigilantes)) {
      vigilantes.forEach((vig) => {
        const exists = db.users.find((u) => u.mat === vig.mat);
        if (!exists) {
          db.users.push({
            mat: vig.mat,
            nome: vig.nome,
            perfil: vig.eq === "ADM" ? "ADMIN" : "USER",
            password: "123456", // Senha padrão
          });
          added++;
        }
      });
    }

    if (added > 0) {
      await saveDB(db);
    }

    res.status(200).json({ success: true, added });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar usuários" });
  }
}
