const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');

router.post('/agregar', auditoriaController.agregarAuditoria);
router.get('/listar', auditoriaController.listarAuditorias);
router.get('/filtro-mayor', auditoriaController.filtrarCantidadMayor);
router.get('/filtro-menor', auditoriaController.filtrarCantidadMenor);
router.get('/filtro-entrada', auditoriaController.filtrarEntradas);
router.get('/filtro-salida', auditoriaController.filtrarSalidas);
router.get('/valor-inventario', auditoriaController.valorTotalInventario);

module.exports = router;