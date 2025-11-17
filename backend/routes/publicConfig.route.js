import express from "express";
const router = express.Router();

const isValidUrl = (url) => {
  try {
    if (!url) return false;
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
};

router.get("/", (req, res) => {
  const cfg = {
    facebook: process.env.FACEBOOK_URL,
    tiktok: process.env.TIKTOK_URL,
    whatsapp: process.env.WHATSAPP_URL,
  };
  const safe = Object.fromEntries(
    Object.entries(cfg).filter(([_, v]) => isValidUrl(v))
  );
  return res.json(safe);
});

export default router;
