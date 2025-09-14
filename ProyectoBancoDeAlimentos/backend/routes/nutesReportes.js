const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/ReportesController');

router.get('/ventas', reportesController.getVentasConFiltros);
router.get('/ventas/export/excel', reportesController.exportVentasExcel);
router.get('/ventas/export/pdf', reportesController.exportVentasPDF);

module.exports = router;

