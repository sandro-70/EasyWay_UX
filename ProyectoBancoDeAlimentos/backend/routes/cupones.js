const express = require('express');
const router = express.Router();

const cuponController = require('../controllers/cuponController');

router.post('/agregar/:id_usuario', cuponController.addCupon);
router.get('/cupones', cuponController.getAllCupones);
router.get('/usuario/:id_usuario', cuponController.allCupones);
router.patch('/desactivar-cupon/:id_cupon', cuponController.desactivarCupon);

module.exports = router;