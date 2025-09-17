const express = require('express');
const router = express.Router();

const cuponController = require('../controllers/cuponController');

// Usar la función que realmente existe en tu controlador
router.post('/agregar/:id_usuario', cuponController.addCuponUsuario);
router.get('/cupones', cuponController.getAllCupones);
router.get('/usuario/:id_usuario', cuponController.allCupones);
router.patch('/desactivar-cupon/:id_cupon', cuponController.desactivarCupon);

module.exports = router;
