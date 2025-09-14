const db = require("../models");

async function insertEstadoPedidoSeed(req, res) {
  const estados = [
    { nombre_pedido: "Pendiente" },
    { nombre_pedido: "Procesando" },
    { nombre_pedido: "Enviado" },
    { nombre_pedido: "Entregado" },
    { nombre_pedido: "Cancelado" },
  ];

  try {
    for (const estado of estados) {
      const exists = await db.estado_pedido.findOne({
        where: { nombre_pedido: estado.nombre_pedido },
      });
      if (!exists) {
        await db.estado_pedido.create(estado);
      }
    }
    if (res) {
      res
        .status(200)
        .json({ message: "Estados de pedido insertados correctamente." });
    } else {
      console.log("Estados de pedido insertados correctamente.");
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error("Error al insertar estados de pedido:", error);
    }
  }
}

module.exports = insertEstadoPedidoSeed;
