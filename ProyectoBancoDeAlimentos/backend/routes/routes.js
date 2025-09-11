const express = require("express");
const { route } = require("./direcciones");
const router = express.Router();

router.use("/auth", require("./routesLogin")); // /api/auth/...
router.use("/prueba", require("./prueba")); // /api/prueba/...
router.use("/dashboard", require("./routesInicioUsuario")); // /api/dashboard/...
router.use("/Inventario", require("./routesInventario"));
router.use("/MiPerfil", require("./routesMiPerfil"));
router.use("/categorias", require("./routesCategoria"));
router.use("/test", require("./test"));
router.use("/forget-password", require("./forgetPassword")); // /api/forget-password , /api/forget-password/cambiar
router.use("/validar-codigo", require("./validarCodigo"));
router.use("/registrarse", require("./routesRegistro")); // /api/registrarse

router.use("/promociones", require("./routesPromocion"));
router.use("/producto", require("./routesProducto"));
router.use("/carrito", require("./routesCarrito"));
router.use("/subcategorias", require("./routesSubcategoria"));

router.use("/agregar-direccion", require("./direcciones"));
router.use("/direcciones", require("./direcciones"));
router.use("/direccion-default", require("./direcciones"));
router.use("/actualizar-direccion", require("./direcciones"));
router.use("/borrar-direccion", require("./direcciones"));

router.use("/metodo-pago", require("./routesMetodoPago"));

router.use("/facturas", require("./routesFactura"));

router.use("/cupones", require("./cupones"));

router.use('/roles-privilegios',require('./roles_privilegios'));

router.use('/pedidos',require('./pedidoRoute'));

router.use('/reportes-usuario', require('./reportesUsuarioRoute'));

module.exports = router;