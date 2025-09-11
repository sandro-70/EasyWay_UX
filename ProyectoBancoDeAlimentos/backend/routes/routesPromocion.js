const express = require('express');
const router  = express.Router();
// GET /api/promociones
const promocionesController = require('../controllers/promocionesController');
router.get('/', promocionesController.listar);
router.get('/:id', promocionesController.getpromocionById);
router.get('/usuario/:id_usuario', promocionesController.getpromocionbyusuario);
router.get('/descuentos/aplicados/:id_usuario', promocionesController.getDescuentosPorUsuario);

module.exports = router;