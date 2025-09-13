const express = require('express');
const router = express.Router();
const usuarioControllers = require('../controllers/userController');

router.get('/estado-usuarios', usuarioControllers.estadosUsuarios);
router.get('/promedio-gasto/:id_usuario', usuarioControllers.promedioGastoUsuario);
router.get('/contar-pedidos/:id_usuario', usuarioControllers.contarPedidosUsuario);
router.put('/actualizar-usuario/:id_usuario', usuarioControllers.editarPerfil);

module.exports = router;