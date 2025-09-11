const express = require('express');
const router  = express.Router();
const carritoCtrl = require('../controllers/carritoController');
const verify = require('../middleware/verificarToken');

router.post('/agregar',   verify, carritoCtrl.agregar);
router.get('/',           verify, carritoCtrl.verCarrito);
router.put('/sumar',      verify, carritoCtrl.sumarItem);
router.post('/cupon',     verify, carritoCtrl.aplicarCupon);
router.delete('/item',    verify, carritoCtrl.eliminarItem);

module.exports = router;