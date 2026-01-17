import { readDB } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mat, password } = req.body;
    const db = await readDB();

    const user = (db.users || []).find(
      (u) => u.mat === mat && u.password === password,
    );

    if (user) {
      // Remove a senha antes de enviar o objeto do usuário
      const { password: _, ...safeUser } = user;
      res.status(200).json({
        success: true,
        user: safeUser,
        token: "vercel-jwt-token-" + Date.now(),
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Matrícula ou senha incorretos" });
    }
  } catch (err) {
    res.status(500).json({ error: "Erro no login" });
  }
}
