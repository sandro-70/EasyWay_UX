const express = require('express');
const router = express.Router();

const reportesUsuarioController = require('../controllers/reportesUsuarioController');
const { route } = require('./routesFactura');

router.post('/top-3-productos', reportesUsuarioController.getTopProductosUsuario);
router.post('/top-3-recomendados', reportesUsuarioController.getProductosRecomendados);
router.post('/top-dias-pedidos',reportesUsuarioController.getDiasCompra);
router.post('/total-ahorrado',reportesUsuarioController.getTotalAhorrado);

module.exports = router;