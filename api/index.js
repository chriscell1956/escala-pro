import app from "../server.js";

export default function handler(req, res) {
  // Hack: Force strip /api prefix if Vercel doesn't do it, or if double-prefixed
  req.url = req.url.replace(/^\/api/, "") || "/";

  return app(req, res);
}
