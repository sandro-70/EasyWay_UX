// routes/uploads.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

//foto de perfil
const FOTO_DIR = path.resolve(__dirname, '..', 'public', 'images', 'fotoDePerfil');
fs.mkdirSync(FOTO_DIR, { recursive: true });


//porductos
const PRODUCTO_DIR = path.resolve(__dirname, '..', 'public', 'images', 'productos');
fs.mkdirSync(PRODUCTO_DIR, { recursive: true });

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

const storageProducto = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCTO_DIR),
  filename: (req, file, cb) => {
    const desired = (file.originalname || '').trim();
    if (desired) return cb(null, desired);
    const ext = path.extname(file.originalname || '.png').toLowerCase() || '.png';
    const timestamp = Date.now();
    cb(null, `Producto_${timestamp}_${file.fieldname}${ext}`);
  },
});

const uploadProducto = multer({ storage: storageProducto, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/profile-photo', upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: 'Archivo requerido (foto)' });
  console.log(' Guardado en:', req.file.path); // 👈 te muestra la ruta real
  return res.json({ ok: true, filename: req.file.filename });
});

router.post('/product-photos', uploadProducto.array('fotos', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ ok: false, msg: 'Archivos requeridos (fotos)' });
  const filenames = req.files.map(file => file.filename);
  console.log(' Fotos guardadas:', filenames);
  return res.json({ ok: true, filenames });
});

module.exports = router;
