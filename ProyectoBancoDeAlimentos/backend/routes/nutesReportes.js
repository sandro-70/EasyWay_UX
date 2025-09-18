const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/ReportesController');

router.get('/ventas', reportesController.getVentasConFiltros);
router.get('/ventas/export/excel', reportesController.exportVentasExcel);
router.get('/ventas/export/pdf', reportesController.exportVentasPDF);
router.get('/reporte-4meses', reportesController.getPromedioVentas4Meses);
router.get('/pedido-mes', reportesController.getPedidosPorMes);
router.get('/ingresos-promocion', reportesController.ingresosPromocionesUltimos4Meses);
router.get('/usuarios-gastos', reportesController.usuariosMasGastos);
router.get('/promociones', reportesController.getReportePromociones);
router.get('/reporte-pedidos', reportesController.getReportePedidos);

module.exports = router;

