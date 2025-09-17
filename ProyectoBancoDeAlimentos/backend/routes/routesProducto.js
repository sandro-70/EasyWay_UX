const express = require('express');
const router  = express.Router();
const { uploadProducto } = require('./routesuploads');
const productoCtrl = require('../controllers/productoController');
const ctrl = require('../controllers/InformationProductoController');
const verificarToken = require('../middleware/verificarToken'); // si quieres proteger con JWT

router.get('/recomendados', productoCtrl.productosRecomendados);
router.get('/destacados', productoCtrl.destacados);
router.get('/tendencias', productoCtrl.tendencias);
router.get('/marcas', productoCtrl.listarMarcas);
router.get('/porcentaje-ganancia', productoCtrl.getAllPorcentajeGanancia);
router.get('/get-stock-sucursal', productoCtrl.getStock);

router.get('/favoritos', verificarToken, ctrl.listMisFavoritos);

router.post('/', verificarToken, uploadProducto.array('imagenes'), productoCtrl.addproducto);
router.get('/', verificarToken, productoCtrl.listarProductos);
router.put('/:id/porcentaje-ganancia', productoCtrl.putPorcentajeGanancia);


router.post('/imagenes', verificarToken, uploadProducto.array('imagenes'), productoCtrl.subirImagenesProducto);
router.delete('/imagenes/:imagenId', verificarToken, productoCtrl.eliminarImagenProducto);

router.get('/:id', verificarToken, productoCtrl.obtenerProductoPorId);
router.get('/:id/imagenes', verificarToken, productoCtrl.imagenesProducto);


router.patch('/desactivar/:id_producto', productoCtrl.desactivarProducto);
router.put('/actualizar-producto/:id_producto', uploadProducto.array('imagenes'), productoCtrl.actualizarProducto);

router.get('/sucursal/:id_sucursal', productoCtrl.listarProductosporsucursal);
router.get ('/:id/valoraciones', ctrl.listValoracionesByProducto); // No requiere token
router.post('/:id/valoraciones', verificarToken, ctrl.addOrUpdateValoracion); // Requiere token

router.post('/marcas', productoCtrl.crearMarca);


module.exports = router;