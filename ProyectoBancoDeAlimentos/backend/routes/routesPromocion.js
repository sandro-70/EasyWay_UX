const express = require('express');
const router  = express.Router();
// GET /api/promociones
const promocionesController = require('../controllers/promocionesController');
const verificarToken = require('../middleware/verificarToken');

router.get('/detalles', promocionesController.listarPromocionesConDetallesURL);

router.get('/', promocionesController.listar);
router.get('/:id', promocionesController.getpromocionById);
router.get('/usuario/:id_usuario', promocionesController.getpromocionbyusuario);
router.get('/descuentos/aplicados/:id_usuario', promocionesController.getDescuentosAplicadosPorUsuario);
router.patch('/descuentosMultiples', verificarToken, promocionesController.aplicarDescuentoseleccionados);


module.exports = router;