const db = require("../models");

async function insertPedidosSeed(req, res) {
  const pedidos = [
    {
      id_estado_pedido: 1, // Pendiente
      id_usuario: 1,
      fecha_pedido: new Date(),
      direccion_envio: "Col. Kennedy, Tegucigalpa",
      id_sucursal: 1,
      descuento: 10.0,
      id_cupon: 1,
    },
    {
      id_estado_pedido: 2, // Procesando
      id_usuario: 2,
      fecha_pedido: new Date(),
      direccion_envio: "Barrio El Centro, La Ceiba",
      id_sucursal: 2,
      descuento: 0.0,
      id_cupon: 2,
    },
    {
      id_estado_pedido: 3, // Enviado
      id_usuario: 3,
      fecha_pedido: new Date(),
      direccion_envio: "Col. Satélite, San Pedro Sula",
      id_sucursal: 2,
      descuento: 20.0,
      id_cupon: 3,
    },
  ];

  try {
    for (const pedido of pedidos) {
      const exists = await db.pedido.findOne({
        where: {
          id_usuario: pedido.id_usuario,
          id_estado_pedido: pedido.id_estado_pedido,
        },
      });
      if (!exists) {
        await db.pedido.create(pedido);
      }
    }
    if (res)
      res.status(200).json({ message: "Pedidos insertados correctamente." });
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error("Error al insertar pedidos:", error);
    }
  }
}

module.exports = insertPedidosSeed;
