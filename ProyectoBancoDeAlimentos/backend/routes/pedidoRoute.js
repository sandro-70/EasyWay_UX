const express = require('express');
const router = express.Router();

const pedidoController = require('../controllers/pedidoController');

// Obtener los pedidos del usuario dado, donde el nombre_pedido sea "Enviado".
router.get('/get-pedido/:id_usuario', pedidoController.getPedidosEntregados);

// Obtener el historial de compras de productos.
router.get('/get-historial', pedidoController.getHistorialComprasProductos);

// Crear un nuevo pedido.
router.post('/crear-pedido', pedidoController.crearPedido);


// Obtener todos los pedidos con sus detalles.
router.get('/pedidos-con-detalles', pedidoController.getPedidosConDetalles);

// Listar un pedido específico con su ID.
router.get('/detalles/:id_pedido', pedidoController.listarPedido);

module.exports = router;