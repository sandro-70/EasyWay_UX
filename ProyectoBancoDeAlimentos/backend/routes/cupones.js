const express = require('express');
const router = express.Router();

const cuponController = require('../controllers/cuponController');

// Usar la función que realmente existe en tu controlador
router.post('/agregar/:id_usuario', cuponController.addCuponUsuario);
router.get('/cupones', cuponController.getAllCupones);
router.get('/usuario/:id_usuario', cuponController.allCupones);
router.patch('/desactivar-cupon/:id_cupon', cuponController.desactivarCupon);
router.put('/editar-cupon/:id_cupon', cuponController.editarCupon);
router.post('/crear-cupon/:id_usuario', cuponController.crearCupon);
router.post("/usar-cupon", cuponController.usarCuponHistorial);
router.get('/check-uso/:id_cupon/usuario/:id_usuario', cuponController.verificarUsoCupon);


module.exports = router;
