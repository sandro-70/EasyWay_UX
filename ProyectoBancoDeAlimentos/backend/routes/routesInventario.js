const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/InventarioRoutes');
const verificarToken = require('../middleware/verificarToken');
const { uploadProducto } = require('./routesuploads');

// GET /api/productos
router.get('/', ctrl.listAll);
router.get('/sucursales',ctrl.getSucursales);
router.put('/abastecer/sucursal/:id_sucursal/producto/:id_producto',verificarToken,ctrl.putAbastecerPorSucursalProducto);
router.post('/productos', verificarToken, uploadProducto.array('imagenes'), ctrl.crear);

// por body
router.put(
  '/abastecer',
  verificarToken,
  ctrl.putAbastecerPorBody
);
module.exports = router;