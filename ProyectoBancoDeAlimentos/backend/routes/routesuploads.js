// routes/uploads.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { imagen_producto } = require('../models');

const router = express.Router();

//foto de perfil
const FOTO_DIR = path.resolve(__dirname, '..', 'public', 'images', 'fotoDePerfil');
fs.mkdirSync(FOTO_DIR, { recursive: true });


//porductos
const PRODUCTO_DIR = path.resolve(__dirname, '..', 'public', 'images', 'productos');
fs.mkdirSync(PRODUCTO_DIR, { recursive: true });

//categorias
const CATEGORIA_DIR = path.resolve(__dirname, '..', 'public', 'images', 'categorias');
fs.mkdirSync(CATEGORIA_DIR, { recursive: true });

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

const storageCategoria = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CATEGORIA_DIR),
  filename: (req, file, cb) => {
    const name = req.query.name || 'default';
    const ext = path.extname(file.originalname || '.png').toLowerCase() || '.png';
    cb(null, `${name}${ext}`);
  },
});

const storageProducto = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCTO_DIR),
  filename: (req, file, cb) => {
    // Try to get product id from req.params, req.body, or unknown
    const productId = req.params.id_producto || req.body.id || 'unknown';
    const ext = path.extname(file.originalname || '.png').toLowerCase() || '.png';
    const unique = Date.now() + Math.random().toString(36).substr(2, 9);
    const filename = `product_${productId}_${unique}${ext}`;
    cb(null, filename);
  },
});

const uploadCategoria = multer({ storage: storageCategoria, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

const uploadProducto = multer({ storage: storageProducto, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/profile-photo', upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: 'Archivo requerido (foto)' });
  console.log(' Guardado en:', req.file.path); // 👈 te muestra la ruta real
  return res.json({ ok: true, filename: req.file.filename });
});


router.post('/category-photo', uploadCategoria.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: 'Archivo requerido (foto)' });
  console.log(' Guardado en:', req.file.path);
  return res.json({ ok: true, filename: req.file.filename });
});

router.post('/product-photos', uploadProducto.array('fotos', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ ok: false, msg: 'Archivos requeridos (fotos)' });
  }

  try {
    const { id_producto } = req.body; // Should be sent with the upload request
    const filenames = req.files.map(file => file.filename);

    // Construct URLs for the uploaded files
    const imagenes = filenames.map((filename, index) => ({
      url_imagen: `/images/productos/${filename}`, // Adjust path as needed
      orden_imagen: index
    }));

    // Save to database if id_producto is provided
    if (id_producto) {
      const imgs = imagenes.map(img => ({
        id_producto: parseInt(id_producto),
        url_imagen: img.url_imagen,
        orden_imagen: img.orden_imagen
      }));
      await imagen_producto.bulkCreate(imgs);
    }

    console.log(' Fotos guardadas:', filenames);
    return res.json({
      ok: true,
      filenames,
      imagenes: imagenes,
      message: id_producto ? 'Archivos subidos y guardados en BD' : 'Archivos subidos'
    });
  } catch (error) {
    console.error('Error saving images to DB:', error);
    return res.status(500).json({ ok: false, msg: 'Error al guardar imágenes' });
  }
});

router.delete('/product-photos/:id_imagen', async (req, res) => {
  try {
    const { id_imagen } = req.params;

    // Find the image in the database
    const imagen = await imagen_producto.findByPk(id_imagen);
    if (!imagen) {
      return res.status(404).json({ ok: false, msg: 'Imagen no encontrada' });
    }

    // Extract filename from url_imagen (assuming format /images/productos/filename)
    const filename = path.basename(imagen.url_imagen);
    const filePath = path.join(PRODUCTO_DIR, filename);

    // Delete the file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await imagen.destroy();

    console.log(' Imagen eliminada:', filename);
    return res.json({ ok: true, msg: 'Imagen eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ ok: false, msg: 'Error al eliminar imagen' });
  }
});




module.exports = router;
module.exports.uploadProducto = uploadProducto;
