const {
  pedido,
  estado_pedido,
  factura,
  factura_detalle,
  producto,
  subcategoria,
  categoria,
  Usuario,
  carrito,
  carrito_detalle,
} = require("../models");
const { Op } = require("sequelize");

//retorna los pedidos del usuario dado, donde el nombre_pedido sea "Enviado".
exports.getPedidosEntregados = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    const pedidosUsuario = await Usuario.findOne({
      where: { id_usuario },
      attributes: ["id_usuario", "nombre", "apellido", "correo"],
      include: [
        {
          model: pedido,
          where: {
            fecha_pedido: {
              [Op.gte]: fechaLimite, //fechaLimite < fecha_pedido
            },
          },
          include: [
            {
              model: estado_pedido,
              where: { nombre_pedido: "Enviado" },
              attributes: ["nombre_pedido"],
            },
          ],
        },
      ],
    });

    if (!pedidosUsuario) {
      return res
        .status(404)
        .json({ error: "Usuario no encontrado o sin pedidos entregados" });
    }

    res.json(pedidosUsuario);
  } catch (error) {
    console.error("Error al obtener pedidos entregados!", error);
    res.status(500).json({ error: "Error al obtener pedidos entregados!" });
  }
};

exports.getHistorialComprasProductos = async (req, res) => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    const detalles = await factura_detalle.findAll({
      attributes: ["subtotal_producto"],
      include: [
        {
          model: producto,
          attributes: ["nombre"],
          include: [
            {
              model: subcategoria,
              as: "subcategoria",
              attributes: ["nombre"],
              include: [
                {
                  model: categoria,
                  as: "categoria",
                  attributes: ["nombre"],
                },
              ],
            },
          ],
        },
        {
          model: factura,
          attributes: ["id_pedido"],
          include: [
            {
              model: pedido,
              attributes: ["fecha_pedido"],
              where: { fecha_pedido: { [Op.gte]: fechaLimite } },
              include: [
                {
                  model: estado_pedido,
                  attributes: ["nombre_pedido"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (detalles.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay productos vendidos en los últimos 30 días!" });
    }

    const resultado = detalles.map((detalle) => ({
      nombre_producto: detalle.producto?.nombre || "Sin nombre",
      categoria:
        detalle.producto?.subcategoria?.categoria?.nombre || "Sin categoría",
      subtotal_producto: detalle.subtotal_producto,
      estado_pedido:
        detalle.factura?.pedido?.estado_pedido?.nombre_pedido || "Sin estado",
      fecha_pedido: detalle.factura?.pedido?.fecha_pedido,
    }));

    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener historial de productos:", error);
    res.status(500).json({ error: "Error al obtener historial de productos" });
  }
};

exports.crearPedido = async (req, res) => {
  console.log("BODY:", req.body);

  const t = await pedido.sequelize.transaction(); //iniciar transaccion
  try {
    const { id_usuario, direccion_envio, id_sucursal, id_cupon, descuento } =
      req.body;

    //obtener carrito
    const cart = await carrito.findOne({
      where: { id_usuario },
      transaction: t,
    });
    if (!cart) {
      await t.rollback();
      return res.status(400).json({ error: "El usuario no tiene carrito" });
    }

    //sacar items del carrito
    const itemsCarrito = await carrito_detalle.findAll({
      where: { id_carrito: cart.id_carrito },
      include: [{ model: producto }],
      transaction: t,
    });

    if (itemsCarrito.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    //crear pedido
    const nuevoPedido = await pedido.create(
      {
        id_usuario,
        direccion_envio,
        id_sucursal,
        id_cupon: id_cupon || null,
        id_estado_pedido: 1, // Pendiente
        descuento: descuento || 0,
      },
      { transaction: t }
    );

    //crear detalles
    const detalles = itemsCarrito.map((item) => ({
      id_factura: null, // se asigna después
      id_producto: item.id_producto,
      cantidad_unidad_medida: item.cantidad_unidad_medida,
      subtotal_producto:
        item.cantidad_unidad_medida * item.producto.precio_base,
    }));
    //crear factura
    const totalFactura =
      detalles.reduce((sum, item) => sum + item.subtotal_producto, 0) -
      (descuento || 0);
    const nuevaFactura = await factura.create(
      {
        id_pedido: nuevoPedido.id_pedido,
        fecha_emision: new Date(),
        total: totalFactura,
      },
      { transaction: t }
    );

    //asignar id factura a cada detalle
    detalles.forEach((d) => (d.id_factura = nuevaFactura.id_factura));
    await factura_detalle.bulkCreate(detalles, { transaction: t });

    //vaciar carrito
    await carrito_detalle.destroy({
      where: { id_carrito: cart.id_carrito },
      transaction: t,
    });

    //confirmar
    await t.commit();

    res.json({
      message: "Pedido creado correctamente!",
      id_pedido: nuevoPedido.id_pedido,
      total: totalFactura,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

exports.getPedidosConDetalles = async (req, res) => {
  try {
    const pedidos = await pedido.findAll({
      include: [
        {
          model: estado_pedido,
          attributes: ["nombre_pedido"], // Incluye solo el nombre del estado del pedido
        },
        {
          model: factura,
          include: [
            {
              model: factura_detalle,
              include: [
                {
                  model: producto,
                  attributes: ["nombre", "precio_base"], // Incluye solo el nombre y precio del producto
                  include: [
                    {
                      model: subcategoria,
                      as: "subcategoria",
                      attributes: ["nombre"],
                      include: [
                        {
                          model: categoria,
                          as: "categoria",
                          attributes: ["nombre"],
                        },
                      ],
                    },
                  ], // Incluye la subcategoría y categoría del producto
                },
              ],
            },
          ],
        },
      ],
    });
    res.json(pedidos);
  } catch (error) {
    console.error("Error al obtener pedidos con detalles:", error);
    res.status(500).json({ error: "Error al obtener pedidos con detalles" });
  }
};

exports.listarPedido = async (req, res) => {
  try {
    const { id_pedido } = req.params;

    // Buscar el pedido y sus detalles
    const pedidoDetalle = await pedido.findOne({
      where: { id_pedido },
      include: [
        {
          model: factura,
          include: [
            {
              model: factura_detalle,
              include: [
                {
                  model: producto,
                  attributes: ["id_producto", "nombre"],
                },
              ],
              attributes: ["cantidad_unidad_medida"],
            },
          ],
        },
      ],
    });

    if (!pedidoDetalle) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Preparar la información para la vista
    const productos = pedidoDetalle.factura.factura_detalles.map((detalle) => ({
      codigo: detalle.producto.id_producto.toString().padStart(4, "0"), // Asegurar 4 dígitos
      nombre: detalle.producto.nombre,
      cantidad: detalle.cantidad_unidad_medida,
    }));

    // Devolver la información del pedido formateada
    res.json({
      numero_pedido: `#${pedidoDetalle.id_pedido.toString().padStart(6, "0")}`, // Asegurar 6 dígitos
      productos,
    });
  } catch (error) {
    console.error("Error al obtener detalles del pedido para vista:", error);
    res
      .status(500)
      .json({ error: "Error al obtener detalles del pedido para vista" });
  }
};

exports.getPedidoDetalles = async (req, res) => {
  try {
    const { id_pedido } = req.params;

    const pedidoEncontrado = await pedido.findByPk(id_pedido, {
      include: [
        {
          model: factura,
          include: [
            {
              model: factura_detalle,
              include: [
                {
                  model: producto,
                  attributes: ["id_producto", "nombre"],
                },
              ],
              attributes: ["cantidad_unidad_medida"],
            },
          ],
        },
      ],
    });

    if (!pedidoEncontrado) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const productos =
      pedidoEncontrado.factura?.factura_detalles?.map((detalle) => ({
        codigo: detalle.producto.id_producto,
        nombre: detalle.producto.nombre,
        cantidad: detalle.cantidad_unidad_medida,
      })) || [];

    res.json({
      id_pedido: pedidoEncontrado.id_pedido,
      productos,
    });
  } catch (error) {
    console.error("Error al obtener detalles del pedido:", error);
    res.status(500).json({ error: "Error al obtener detalles del pedido" });
  }
};
