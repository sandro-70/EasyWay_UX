const express = require("express");
const router = express.Router();

const facturasController = require("../controllers/facturaController");
const verificarToken = require('../middleware/verificarToken'); // el mismo que usaste en /me

// Aplica auth a TODO este router
router.use(verificarToken);
// Obtener todas las facturas del usuario autenticado con detalles
router.get("/", facturasController.getAllFacturasByUserwithDetails);

router.get("/resumen/:id_usuario", facturasController.getResumenFacturasUsuario);

module.exports = router;
