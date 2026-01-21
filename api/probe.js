export default function handler(req, res) {
  res.status(200).json({
    status: "alive",
    url: req.url,
    query: req.query,
    env: process.env.VERCEL ? "vercel" : "local",
  });
}
