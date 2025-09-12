// routes/uploads.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

const FOTO_DIR = path.resolve(__dirname, '..', 'public', 'images', 'fotoDePerfil');
fs.mkdirSync(FOTO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FOTO_DIR),
  filename: (req, file, cb) => {
    const desired = (file.originalname || '').trim(); // llega desde FormData.append("foto", file, safeName)
    if (desired) return cb(null, desired);
    const ext = path.extname(file.originalname || '.png').toLowerCase() || '.png';
    cb(null, `UserFotoPerfil${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype?.startsWith('image/')) return cb(new Error('Solo imágenes'), false);
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/profile-photo', upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: 'Archivo requerido (foto)' });
  console.log('📁 Guardado en:', req.file.path); // 👈 te muestra la ruta real
  return res.json({ ok: true, filename: req.file.filename });
});

module.exports = router;
