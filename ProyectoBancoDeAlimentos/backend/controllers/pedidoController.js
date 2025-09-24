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
  sucursal,
  sucursal_producto,
  metodo_pago,
  cupon,
} = require("../models");
const { Op, col, fn } = require("sequelize");

exports.getEstados = async (req,res) => {
  try {
    const pedidos = await estado_pedido.findAll();
    return res.json(pedidos);
  }catch(error){
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error al obtener estados de pedidos" });
  }
}

exports.getPedidosEstado = async (req, res) => {
  try {
    const id_usuario = parseInt(req.params.id_usuario, 10);
    if (Number.isNaN(id_usuario)) {
      return res.status(400).json({ error: 'id_usuario inválido' });
    }

    const rows = await pedido.findAll({
      where: { id_usuario },
      attributes: [
        'id_pedido',
        [col('estado_pedido.nombre_pedido'), 'nombre_pedido'],
      ],
      include: [
        {
          model: estado_pedido,
          attributes: [],
          required: true,
        },
      ],
      order: [['id_pedido', 'ASC']],
      raw: true,
    });

    return res.json(rows);
  } catch (error) {
    console.error("Error al obtener pedidos por usuario:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener pedidos por usuario" });
  }
};

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

// TOP VENDIDOS (agregado por producto): últimos N días, opcionalmente filtrado por estado del pedido.
// Ejemplo: GET /api/pedidos/reportes/top-vendidos?days=30&limit=10&estado=Enviado
exports.getTopVendidos = async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || "30", 10)); // por defecto 30 días
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10)); // por defecto top 10
    const estado = (req.query.estado || "").trim(); // "Enviado" / "Entregado" / etc.

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - days);

    const rows = await factura_detalle.findAll({
      attributes: [
        "id_producto",
        [
          fn("SUM", col("factura_detalle.cantidad_unidad_medida")),
          "total_cantidad",
        ],
        [fn("SUM", col("factura_detalle.subtotal_producto")), "total_ingreso"],
      ],
      include: [
        {
          model: factura,
          attributes: [],
          include: [
            {
              model: pedido,
              attributes: [],
              where: { fecha_pedido: { [Op.gte]: fechaLimite } },
              include: estado
                ? [
                    {
                      model: estado_pedido,
                      required: true,
                      attributes: [],
                      where: { nombre_pedido: estado },
                    },
                  ]
                : [
                    {
                      model: estado_pedido,
                      required: false,
                      attributes: [],
                    },
                  ],
            },
          ],
        },
        {
          model: producto,
          attributes: ["id_producto", "nombre", "precio_base"],
          include: [
            {
              model: subcategoria,
              as: "subcategoria",
              attributes: ["id_subcategoria", "nombre"],
              include: [
                {
                  model: categoria,
                  as: "categoria",
                  attributes: ["id_categoria", "nombre"],
                },
              ],
            },
          ],
        },
      ],
      group: [
        "factura_detalle.id_producto",
        "producto.id_producto",
        "producto->subcategoria.id_subcategoria",
        "producto->subcategoria->categoria.id_categoria",
      ],
      order: [[col("total_cantidad"), "DESC"]],
      limit,
      raw: false,
      subQuery: false,
    });

    const result = rows.map((r) => ({
      id_producto: r.id_producto,
      nombre: r.producto?.nombre || "Sin nombre",
      precio_base: Number(r.producto?.precio_base ?? 0),
      subcategoria: r.producto?.subcategoria?.nombre || null,
      categoria: r.producto?.subcategoria?.categoria?.nombre || null,
      total_cantidad: Number(r.get("total_cantidad") || 0),
      total_ingreso: Number(r.get("total_ingreso") || 0),
    }));

    res.json({ days, limit, estado: estado || null, topProductos: result });
  } catch (error) {
    console.error("Error en getTopVendidos:", error);
    res.status(500).json({ error: "Error al obtener top vendidos" });
  }
};

exports.getMasNuevos = async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || "30", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - days);

    const rows = await producto.findAll({
      attributes: [
        "id_producto",
        "nombre",
        "precio_base",
        "createdAt",
        "fecha_creacion",
        "fecha_publicacion",
      ],
      where: {
        [Op.or]: [
          { createdAt: { [Op.gte]: fechaLimite } },
          { fecha_creacion: { [Op.gte]: fechaLimite } },
          { fecha_publicacion: { [Op.gte]: fechaLimite } },
        ],
      },
      include: [
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre"],
          include: [
            {
              model: categoria,
              as: "categoria",
              attributes: ["id_categoria", "nombre"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // si tu tabla usa otro campo, cámbialo
      limit,
    });

    const out = rows.map((r) => {
      const fecha =
        r.get?.("fecha_creacion") ||
        r.get?.("fecha_publicacion") ||
        r.get?.("createdAt") ||
        r.fecha_creacion ||
        r.fecha_publicacion ||
        r.createdAt ||
        null;

      return {
        id_producto: r.id_producto,
        nombre: r.nombre,
        precio_base: Number(r.precio_base ?? 0),
        subcategoria: r.subcategoria?.nombre || null,
        categoria: r.subcategoria?.categoria?.nombre || null,
        fecha_creacion: fecha,
        is_nuevo:
          !!fecha &&
          Date.now() - new Date(fecha).getTime() <= days * 24 * 60 * 60 * 1000,
      };
    });

    res.json({ days, limit, nuevos: out });
  } catch (e) {
    console.error("Error en getMasNuevos:", e);
    res.status(500).json({ error: "Error al obtener más nuevos" });
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

    // Obtener método de pago predeterminado del usuario
    const metodoPredeterminado = await metodo_pago.findOne({
      where: { id_usuario, metodo_predeterminado: true },
      transaction: t,
    });

    if (!metodoPredeterminado) {
      await t.rollback();
      return res.status(400).json({
        error:
          "No se encontró un método de pago predeterminado para el usuario",
      });
    }

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

    //validar existencia
    for (const item of itemsCarrito) {
      const sucProd = await sucursal_producto.findOne({
        where: {
          id_sucursal,
          id_producto: item.id_producto,
        },
        transaction: t,
      });

      //existe?
      if (!sucProd) {
        await t.rollback();
        return res.status(400).json({
          error: `El producto con ID ${item.id_producto} no está disponible en la sucursal seleccionada`,
        });
      }

      //suficiente?
      if (sucProd.stock_disponible < item.cantidad_unidad_medida) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente para el producto ${item.producto.nombre}. Disponible: ${sucProd.stock_disponible}, solicitado: ${item.cantidad_unidad_medida}`,
        });
      }
    }

    //crear detalles preliminares para calcular subtotal
    const detalles = itemsCarrito.map((item) => ({
      id_factura: null, // se asigna después
      id_producto: item.id_producto,
      cantidad_unidad_medida: item.cantidad_unidad_medida,
      subtotal_producto:
        item.cantidad_unidad_medida * item.producto.precio_base,
    }));

    // Calcular subtotal
    const subtotal = detalles.reduce((sum, item) => sum + item.subtotal_producto, 0);

    // Calcular costo de envío
    const costoEnvio = 10.00;

    // Validar si el cupón existe y está activo si se proporciona
    let descuentoCalculado = descuento || 0;
    let id_cupon_valido = null;

    let cuponExistente = null;
    if (id_cupon) {
      console.log("Validando cupón con id:", id_cupon);
      cuponExistente = await cupon.findByPk(id_cupon, { transaction: t });
    }

    console.log("Resultado de búsqueda de cupón:", cuponExistente);
    if (cuponExistente && cuponExistente.activo) {
      console.log("Cupón válido:", cuponExistente);
      id_cupon_valido = cuponExistente.id_cupon;
      // Calcular descuento basado en el tipo de cupón
      if (cuponExistente.tipo === 'porcentaje') {
        descuentoCalculado = subtotal * (cuponExistente.valor / 100);
      } else if (cuponExistente.tipo === 'monto') {
        descuentoCalculado = cuponExistente.valor;
      } else if (cuponExistente.tipo === 'envio') {
        // Para envío gratis, el descuento será el costo de envío
        descuentoCalculado = costoEnvio;
      }
      console.log("Descuento calculado del cupón:", descuentoCalculado);
    } else {
      console.log("Cupón inválido o inactivo:", id_cupon, "- Procediendo sin cupón");
      id_cupon_valido = null;
    }

    //crear pedido
    const nuevoPedido = await pedido.create(
      {
        id_usuario,
        direccion_envio,
        id_sucursal,
        id_cupon: id_cupon_valido,
        id_estado_pedido: 1, // Pendiente
        descuento: descuentoCalculado,
      },
      { transaction: t }
    );

    for (const item of itemsCarrito) {
      const sucProd = await sucursal_producto.findOne({
        where: { id_sucursal, id_producto: item.id_producto },
        transaction: t,
      });
      sucProd.stock_disponible -= item.cantidad_unidad_medida;
      await sucProd.save({ transaction: t });
    }

    // Aplicar descuento al subtotal
    const subtotalConDescuento = Math.max(0, subtotal - descuentoCalculado);

    // Calcular impuestos (15% del subtotal con descuento)
    const impuestos = subtotalConDescuento * 0.15;

    // Calcular total final (subtotal con descuento + impuestos + envío)
    const totalFactura = subtotalConDescuento + impuestos + costoEnvio;

    // Debug: Mostrar cálculos
    console.log("=== DEBUG INFO ===");
    console.log("Productos en el carrito:");
    itemsCarrito.forEach((item, index) => {
      console.log(`Producto ${index + 1}: ID=${item.id_producto}, Nombre=${item.producto.nombre}, Cantidad=${item.cantidad_unidad_medida}, Precio=${item.producto.precio_base}, Subtotal=${item.cantidad_unidad_medida * item.producto.precio_base}`);
    });
    console.log(`Subtotal: ${subtotal}`);
    console.log(`Descuento calculado: ${descuentoCalculado}`);
    console.log(`Impuestos (15%): ${impuestos}`);
    console.log(`Costo de envío: ${costoEnvio}`);
    console.log(`Total calculado: ${totalFactura}`);
    console.log("=== END DEBUG ===");

    const nuevaFactura = await factura.create(
      {
        id_pedido: nuevoPedido.id_pedido,
        id_metodo_pago: metodoPredeterminado.id_metodo_pago,
        fecha_emision: new Date(),
        impuestos: impuestos,
        costo_evio: costoEnvio,
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
      subtotal: subtotal,
      impuestos: impuestos,
      costo_envio: costoEnvio,
      descuento: descuentoCalculado,
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
          attributes: ["nombre_pedido"],
        },
        {
          model: factura,
          include: [
            {
              model: factura_detalle,
              include: [
                {
                  model: producto,
                  attributes: ["nombre", "precio_base", "id_producto"],
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

exports.getPedidosConDetallesUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const pedidos = await pedido.findAll({
      where: { id_usuario },
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
    console.error("Error al obtener pedidos con detalles del usuario:", error);
    res
      .status(500)
      .json({ error: "Error al obtener pedidos con detalles del usuario" });
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

// Actualizar estado de un pedido
exports.actualizarEstado = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    const { id_estado_pedido } = req.body;

    if (!id_estado_pedido) {
      return res
        .status(400)
        .json({ error: "Falta id_estado_pedido en el body" });
    }

    const pedidoToUpdate = await pedido.findByPk(id_pedido);
    if (!pedidoToUpdate) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    pedidoToUpdate.id_estado_pedido = id_estado_pedido;
    await pedidoToUpdate.save();

    // opcional: devolver pedido con estado incluido
    const updated = await pedido.findOne({
      where: { id_pedido },
      include: [{ model: estado_pedido, attributes: ["nombre_pedido"] }],
    });

    res.json({ message: "Estado actualizado", pedido: updated });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).json({ error: "Error al actualizar estado del pedido" });
  }
};


exports.getPedidosPorProducto = async (req, res) => {
  try {
    const { id_producto } = req.params;

    const pedidos = await pedido.findAll({
      attributes: ["id_pedido", "fecha_pedido"],
      include: [
        {
          model: sucursal,
          attributes: ["nombre_sucursal"],
        },
        {
          model: factura,
          attributes: ["id_factura"],
          include: [
            {
              model: factura_detalle,
              where: { id_producto },
              include: [
                {
                  model: producto,
                  include: [
                    {
                      model: subcategoria,
                      as: "subcategoria",
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
              ],
            },
          ],
        },
      ],
      raw: false,
      nest: true,
    });

    if (!pedidos.length) {
      return res.status(404).json({ message: "No hay pedidos con ese producto" });
    }

    // 👇 para ver la estructura real
    console.log(JSON.stringify(pedidos, null, 2));

    const resultado = pedidos.map(p => {
      const detalle = p.factura?.factura_detalles?.[0];
      return {
        id_pedido: p.id_pedido,
        fecha_pedido: p.fecha_pedido,
        nombre_sucursal: p.sucursal?.nombre_sucursal || null,
        nombre_categoria: detalle?.producto?.subcategoria?.categoria?.nombre || null,
      };
    });

    return res.json(resultado);
  } catch (error) {
    console.error("Error obteniendo pedidos por producto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.getPedidosByUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const pedidos = await pedido.findAll({
      where: { id_usuario },
      attributes: { exclude: [] }
    });

    if (!pedidos.length) {
      return res.status(404).json({ message: "Este usuario no tiene pedidos" });
    }

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("Error obteniendo pedidos del usuario:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};