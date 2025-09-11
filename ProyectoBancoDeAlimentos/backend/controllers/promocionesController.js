const { promocion, Usuario, pedido, promocion_pedido, producto, estado_pedido, factura, promocion_producto } = require("../models");

const { Op } = require('sequelize');

exports.listar = async (req, res) => {
    try {
        const promos = await promocion.findAll({
        where: { activa: true },
        order: [['fecha_inicio', 'DESC']]
        });
        res.json(promos)
    } catch (error) {
        console.error('Error solicitando categories:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getpromocionById = async (req, res) => {
    try {
        const { id } = req.params;  
        const promo = await promocion.findByPk(id);
        if (!promo) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }
        res.json(promo);
    } catch (error) {
        console.error('Error solicitando promoción por ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getpromocionbyusuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const promos = await promocion.findAll({
            where: { activa: true },
            include: [{
                model: pedido,
                where: { id_usuario },
                required: true,
                attributes: [] // No necesitamos los atributos del pedido
            }],
            order: [['fecha_inicio', 'DESC']]
        });
        res.json(promos)
    } catch (error) {
        console.error('Error solicitando promociones por usuario:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



exports.getDescuentosPorUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;

        // Consulta para obtener los descuentos aplicados por usuario
        const descuentos = await promocion_pedido.findAll({
            include: [
                {
                    model: promocion,
                    where: { activa: true },
                    required: true,
                    attributes: ['id_promocion', 'nombre_promocion', 'descripcion', 'valor_fijo', 'valor_porcentaje', 'fecha_inicio', 'fecha_termina']
                },
                {
                    model: pedido,
                    where: { id_usuario },
                    required: true,
                    attributes: ['id_pedido', 'fecha_pedido']
                }
            ],
            order: [['fecha_pedido', 'DESC']]
        });

        console.log('Descuentos obtenidos:', descuentos);

        // Verificar si se encontraron descuentos
        if (!descuentos || descuentos.length === 0) {
            return res.status(404).json({ error: 'No se encontraron descuentos para el usuario' });
        }

        // Formatear los datos para que cada descuento tenga la información necesaria
        const descuentosFormateados = descuentos.map(descuento => {
            if (!descuento.pedido || !descuento.promocion) {
                throw new Error('Pedido o promoción no encontrados en el descuento');
            }

            return {
                id_promocion: descuento.promocion.id_promocion,
                nombre_promocion: descuento.promocion.nombre_promocion,
                descripcion: descuento.promocion.descripcion,
                valor_fijo: descuento.promocion.valor_fijo,
                valor_porcentaje: descuento.promocion.valor_porcentaje,
                fecha_inicio: descuento.promocion.fecha_inicio,
                fecha_termina: descuento.promocion.fecha_termina,
                id_pedido: descuento.pedido.id_pedido,
                fecha_pedido: descuento.pedido.fecha_pedido,
                monto_descuento: descuento.monto_descuento
            };
        });

        res.json(descuentosFormateados);
    } catch (error) {
        console.error('Error al obtener descuentos por usuario:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllPromotionsWithDetails = async (req, res) => {
  try {
    const promotions = await promocion.findAll({
      attributes: ['id_promocion', 'banner_url'],
      include: [
        {
          model: tipo_promocion,
          attributes: ['id_tipo_promo', 'nombre_tipo_promocion']
        },
        {
          model: promocion_producto,
          attributes: [],
          include: {
            model: producto,
            attributes: ['id_producto', 'nombre']
          }
        }
      ],
      order: [['fecha_inicio', 'DESC']]
    });

    if (promotions.length === 0) {
      return res.status(404).json({ message: "No hay promociones disponibles" });
    }

    res.json(promotions);
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
};



exports.listarPromocionesConDetallesURL = async (req, res) => {
  try {
    // Buscar todas las promociones
    const promociones = await promocion.findAll({
      include: [
        {
          model: producto,
          through: promocion_producto,
          as: 'productos', // Asegúrate de que el alias 'productos' coincida con el alias definido en las asociaciones
          attributes: ['id_producto'], // Solo seleccionamos el id del producto
        }
      ],
      attributes: ['id_promocion', 'id_tipo_promo', 'banner_url'] // Campos que queremos de la promoción
    });

    // Formatear los datos para que cada promoción tenga un array de productos
    const promocionesConDetalles = promociones.map(promocion => ({
      id_promocion: promocion.id_promocion,
      id_tipo_promo: promocion.id_tipo_promo,
      banner_url: promocion.banner_url,
      productos: promocion.productos.map(producto => producto.id_producto)
    }));

    res.json(promocionesConDetalles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las promociones' });
  }
};



// controllers/promocionesController.js


exports.getDescuentosAplicadosPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    // 1) Traer pedidos del usuario
    const pedidosUsuario = await pedido.findAll({
      where: { id_usuario },
      attributes: ["id_pedido", "fecha_pedido"],
      order: [["fecha_pedido", "DESC"]],
    });

    if (!pedidosUsuario || pedidosUsuario.length === 0) {
      return res.status(404).json({ message: "No hay pedidos para este usuario" });
    }

    // 2) Para cada pedido, traer factura y promociones
    const resultado = await Promise.all(
      pedidosUsuario.map(async (p) => {
        // OJO: renombramos la variable para no chocar con el modelo 'factura'
        const facturaRow = await factura.findOne({
          where: { id_pedido: p.id_pedido },
          attributes: ["id_factura", "total"],
        });

        // Varias promociones pueden aplicar a un pedido
        const promosPedido = await promocion_pedido.findAll({
          where: { id_pedido: p.id_pedido },
          attributes: ["id_promocion_pedido", "id_promocion", "monto_descuento"],
        });

        let promocionesInfo = [];
        let descuentoTotal = 0;

        if (promosPedido && promosPedido.length > 0) {
          const idsPromos = promosPedido.map((pp) => pp.id_promocion).filter(Boolean);

          // Traer nombres de las promociones en bloque
          let promosCatalogo = [];
          if (idsPromos.length > 0) {
            promosCatalogo = await promocion.findAll({
              where: { id_promocion: idsPromos },
              attributes: ["id_promocion", "nombre_promocion"],
            });
          }

          const mapaPromos = new Map(
            promosCatalogo.map((row) => [row.id_promocion, row.nombre_promocion])
          );

          promocionesInfo = promosPedido.map((pp) => ({
            id_promocion_pedido: pp.id_promocion_pedido,
            id_promocion: pp.id_promocion,
            nombre_promocion: mapaPromos.get(pp.id_promocion) || "Sin promoción",
            monto_descuento: Number(pp.monto_descuento) || 0,
          }));

          descuentoTotal = promocionesInfo.reduce(
            (acc, it) => acc + (Number(it.monto_descuento) || 0),
            0
          );
        }

        return {
          id_pedido: p.id_pedido,
          fecha_pedido: p.fecha_pedido,
          id_factura: facturaRow ? facturaRow.id_factura : null,
          total_factura: facturaRow ? Number(facturaRow.total) : null,
          descuento_total: descuentoTotal,
          promociones: promocionesInfo, // lista (puede venir vacía)
        };
      })
    );

    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener descuentos por usuario:", error);
    res.status(500).json({ error: "Error al obtener descuentos por usuario" });
  }
};


exports.aplicarDescuentoseleccionados = async (req, res) => {
  try {
    const { selectedProductIds, discountType, discountValue } = req.body;
    const currentUserId = req.user.id_usuario;

    // Verificar si el usuario es administrador
    const user = await Usuario.findByPk(currentUserId, {
      attributes: ['id_rol'],
    });

    if (!user || user.id_rol !== 1) {
      return res.status(403).json({ message: 'Solo los administradores pueden aplicar descuentos' });
    }

    // Aplicar el descuento a los productos seleccionados
    for (const id_producto of selectedProductIds) {
      const product = await producto.findByPk(id_producto);
      if (!product) {
        continue; // Si no se encuentra el producto, continuar con el siguiente
      }

      let promocionExistente = await promocion.findOne({
        where: {
          id_producto: id_producto,
        },
        include: [{
          model: tipo_promocion,
        }],
      });

      if (!promocionExistente) {
        promocionExistente = await promocion.create({
          id_producto: id_producto,
          id_tipo_promo: 2, // Suponiendo que 2 es el ID para descuentos por producto
        });
      }

      if (discountType === 'percent') {
        promocionExistente.valor_porcentaje = parseFloat(discountValue);
        promocionExistente.valor_fijo = null;
      } else if (discountType === 'fixed') {
        promocionExistente.valor_porcentaje = null;
        promocionExistente.valor_fijo = parseFloat(discountValue);
      }

      await promocionExistente.save();
    }

    res.json({ message: 'Descuentos aplicados correctamente' });
  } catch (error) {
    console.error('Error al aplicar descuentos:', error);
    res.status(500).json({ error: 'Error al aplicar descuentos' });
  }
};
