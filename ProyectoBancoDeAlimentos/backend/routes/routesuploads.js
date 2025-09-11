const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const router = express.Router();

const FOTO_DIR = path.join(process.cwd(), "public", "images", "fotoDePerfil");
fs.mkdirSync(FOTO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, FOTO_DIR),
  filename: (req, file, cb) => {
    const desired = (file.originalname || "").trim(); // te llega desde FormData.append("foto", file, safeName)
    if (desired) return cb(null, desired);
    const ext = path.extname(file.originalname || ".png").toLowerCase() || ".png";
    cb(null, `UserFotoPerfil${ext}`);
  },
});

const fileFilter = (_, file, cb) => {
  if (!file.mimetype?.startsWith("image/")) return cb(new Error("Solo imágenes"), false);
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/uploads/profile-photo  (campo form-data: "foto")
router.post("/profile-photo", upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, msg: "Archivo requerido (foto)" });

    const filename = req.file.filename; // ← SOLO nombre (guárdalo en BD)
    // Ejemplo de UPDATE (actívalo cuando tengas el modelo y auth listos):
    // const { usuario } = require("../models");
    // const id_usuario = req.user?.id_usuario; // según tu auth
    // if (id_usuario) await usuario.update({ foto_perfil_url: filename }, { where: { id_usuario } });

    return res.json({ ok: true, filename });
  } catch (e) {
    console.error("Upload error:", e);
    return res.status(500).json({ ok: false, msg: "Error subiendo foto" });
  }
});

module.exports = router;
