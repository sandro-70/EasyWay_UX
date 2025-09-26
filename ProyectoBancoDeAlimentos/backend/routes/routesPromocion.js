const express = require('express');
const router  = express.Router();
// GET /api/promociones
const promocionesController = require('../controllers/promocionesController');
const verificarToken = require('../middleware/verificarToken');

router.get('/detalles', promocionesController.listarPromocionesConDetallesURL);
router.get('/listarorden', promocionesController.listarPorOrden);
router.get('/productos-promo/:id_promocion', promocionesController.productosPorPromocion);


router.get('/', promocionesController.listar);

router.get('/:id', promocionesController.getpromocionById);
router.get('/usuario/:id_usuario', promocionesController.getpromocionbyusuario);
router.get('/descuentos/aplicados/:id_usuario', promocionesController.getDescuentosAplicadosPorUsuario);
router.patch('/descuentosMultiples', verificarToken, promocionesController.aplicarDescuentoseleccionados);
router.post('/precios-escalonados/bulk', verificarToken, promocionesController.aplicarPreciosEscalonados);


router.post('/', verificarToken, promocionesController.crearPromocion);
router.put('/desactivar/:id', verificarToken, promocionesController.desactivarPromocion);
router.put('/activar/:id', verificarToken, promocionesController.activarPromocion);
router.put('/actualizar/:id', verificarToken, promocionesController.actualizarPromocion);



module.exports = router;