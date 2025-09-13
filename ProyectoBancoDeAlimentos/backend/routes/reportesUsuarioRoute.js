const express = require('express');
const router = express.Router();

const reportesUsuarioController = require('../controllers/reportesUsuarioController');
const { route } = require('./routesFactura');

router.post('/top-3-productos', reportesUsuarioController.getTopProductosUsuario);
router.post('/top-3-recomendados', reportesUsuarioController.getProductosRecomendados);
router.post('/top-dias-pedidos',reportesUsuarioController.getDiasCompra);
router.post('/total-ahorrado',reportesUsuarioController.getTotalAhorrado);
router.get('/reporte', reportesUsuarioController.getUsuariosReporte);
router.get('/reporte-filtrado/', reportesUsuarioController.getUsuariosTabla);
router.get('/clientes-nuevos', reportesUsuarioController.getClientesNuevos);

module.exports = router;