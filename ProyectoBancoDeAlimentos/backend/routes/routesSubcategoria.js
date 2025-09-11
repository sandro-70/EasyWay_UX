const express = require('express');
const router  = express.Router();
const subcategoriaCtrl = require('../controllers/subcategoriaController');


// POST /api/subcategorias/comparProductos
router.post('/comparProductos', subcategoriaCtrl.compararProductos);

// GET /api/subcategorias/por-categoria/:id_categoria_padre   ✅ ESPECÍFICO
router.get('/por-categoria/:id_categoria_padre', subcategoriaCtrl.listarPorCategoria);

// CRUD estándar
router.get('/', subcategoriaCtrl.listar);          // lista todas
router.get('/:id', subcategoriaCtrl.obtener);      // obtener por id de subcategoria
router.post('/', subcategoriaCtrl.crear);
router.put('/:id', subcategoriaCtrl.actualizar);
router.delete('/:id', subcategoriaCtrl.desactivarProductos);

module.exports = router;
