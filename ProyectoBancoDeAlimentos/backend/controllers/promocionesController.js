const {
  promocion,
  Usuario,
  pedido,
  promocion_pedido,
  producto,
  estado_pedido,
  factura,
  promocion_producto,
  subcategoria,
  categoria,
  sequelize,
} = require("../models");

const { Op } = require("sequelize");

exports.listar = async (req, res) => {
  try {
    const promos = await promocion.findAll({
      where: { activa: true },
      order: [["fecha_inicio", "DESC"]],
    });
    res.json(promos);
  } catch (error) {
    console.error("Error solicitando categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.listarPorOrden = async (req, res) => {
  try {
    const promos = await promocion.findAll({
      where: { activa: { [Op.ne]: null }, orden: { [Op.ne]: null } },
      order: [["orden", "ASC"]],
    });
    res.json(promos);
  } catch (error) {
    console.error("Error solicitando categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getpromocionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await promocion.findByPk(id);
    if (!promo) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }
    res.json(promo);
  } catch (error) {
    console.error("Error solicitando promoción por ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getpromocionbyusuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const promos = await promocion.findAll({
      where: { activa: true },
      include: [
        {
          model: pedido,
          where: { id_usuario },
          required: true,
          attributes: [], // No necesitamos los atributos del pedido
        },
      ],
      order: [["fecha_inicio", "DESC"]],
    });
    res.json(promos);
  } catch (error) {
    console.error("Error solicitando promociones por usuario:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
          attributes: [
            "id_promocion",
            "nombre_promocion",
            "descripcion",
            "valor_fijo",
            "valor_porcentaje",
            "fecha_inicio",
            "fecha_termina",
          ],
        },
        {
          model: pedido,
          where: { id_usuario },
          required: true,
          attributes: ["id_pedido", "fecha_pedido"],
        },
      ],
      order: [["fecha_pedido", "DESC"]],
    });

    console.log("Descuentos obtenidos:", descuentos);

    // Verificar si se encontraron descuentos
    if (!descuentos || descuentos.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontraron descuentos para el usuario" });
    }

    // Formatear los datos para que cada descuento tenga la información necesaria
    const descuentosFormateados = descuentos.map((descuento) => {
      if (!descuento.pedido || !descuento.promocion) {
        throw new Error("Pedido o promoción no encontrados en el descuento");
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
        monto_descuento: descuento.monto_descuento,
      };
    });

    res.json(descuentosFormateados);
  } catch (error) {
    console.error("Error al obtener descuentos por usuario:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllPromotionsWithDetails = async (req, res) => {
  try {
    const promotions = await promocion.findAll({
      attributes: ["id_promocion", "banner_url"],
      include: [
        {
          model: tipo_promocion,
          attributes: ["id_tipo_promo", "nombre_tipo_promocion"],
        },
        {
          model: promocion_producto,
          attributes: [],
          include: {
            model: producto,
            attributes: ["id_producto", "nombre"],
          },
        },
      ],
      order: [["fecha_inicio", "DESC"]],
    });

    if (promotions.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay promociones disponibles" });
    }

    res.json(promotions);
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    res.status(500).json({ error: "Error al obtener promociones" });
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
          as: "productos", // Asegúrate de que el alias 'productos' coincida con el alias definido en las asociaciones
          attributes: ["id_producto"], // Solo seleccionamos el id del producto
        },
      ],
      attributes: ["id_promocion", "id_tipo_promo", "banner_url"], // Campos que queremos de la promoción
    });

    // Formatear los datos para que cada promoción tenga un array de productos
    const promocionesConDetalles = promociones.map((promocion) => ({
      id_promocion: promocion.id_promocion,
      id_tipo_promo: promocion.id_tipo_promo,
      banner_url: promocion.banner_url,
      productos: promocion.productos.map((producto) => producto.id_producto),
    }));

    res.json(promocionesConDetalles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las promociones" });
  }
};

// controllers/promocionesController.js

exports.getDescuentosAplicadosPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    // 1) Traer pedidos del usuario
    const pedidosUsuario = await pedido.findAll({
      where: { id_usuario },
      attributes: ["id_pedido", "fecha_pedido", "descuento"],
      order: [["fecha_pedido", "DESC"]],
    });

    if (!pedidosUsuario || pedidosUsuario.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay pedidos para este usuario" });
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
          attributes: [
            "id_promocion_pedido",
            "id_promocion",
            "monto_descuento",
          ],
        });

        let promocionesInfo = [];
        let descuentoTotal = 0;

        if (promosPedido && promosPedido.length > 0) {
          const idsPromos = promosPedido
            .map((pp) => pp.id_promocion)
            .filter(Boolean);

          // Traer nombres de las promociones en bloque
          let promosCatalogo = [];
          if (idsPromos.length > 0) {
            promosCatalogo = await promocion.findAll({
              where: { id_promocion: idsPromos },
              attributes: ["id_promocion", "nombre_promocion"],
            });
          }

          const mapaPromos = new Map(
            promosCatalogo.map((row) => [
              row.id_promocion,
              row.nombre_promocion,
            ])
          );

          promocionesInfo = promosPedido.map((pp) => ({
            id_promocion_pedido: pp.id_promocion_pedido,
            id_promocion: pp.id_promocion,
            nombre_promocion:
              mapaPromos.get(pp.id_promocion) || "Sin promoción",
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
          descuento_total: descuentoTotal || Number(p.descuento) || 0,
          descuento_pedido: Number(p.descuento) || 0,
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
  const t = await sequelize.transaction();
  try {
    const {
      selectedProductIds,
      discountType,
      discountValue,
      startDate,
      endDate,
    } = req.body;

    if (!req.user || !req.user.id_usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    const user = await Usuario.findByPk(req.user.id_usuario, {
      attributes: ["id_rol"],
    });
    if (!user || user.id_rol !== 1) {
      return res.status(403).json({
        message: "Solo los administradores pueden aplicar descuentos",
      });
    }

    const isPercent = discountType === "percent";
    const valor = parseFloat(discountValue);
    if (isPercent && (isNaN(valor) || valor < 1 || valor > 100)) {
      return res.status(400).json({ message: "Porcentaje inválido (1–100)." });
    }
    if (!isPercent && (isNaN(valor) || valor < 0)) {
      return res.status(400).json({ message: "Monto fijo inválido (≥ 0)." });
    }

    for (const id_producto of selectedProductIds) {
      // buscar promoción tipo 2 ya asociada a ese producto
      let promo = await promocion.findOne({
        where: { id_tipo_promo: 2 },
        include: [
          {
            model: producto,
            where: { id_producto },
            through: { attributes: [] },
            required: true,
          },
        ],
        transaction: t,
      });

      if (!promo) {
        // crear promoción y asociación
        promo = await promocion.create(
          {
            id_tipo_promo: 2,
            nombre_promocion: "Descuento General",
            activa: true,
            fecha_inicio: startDate || null,
            fecha_termina: endDate || null,
            compra_min: null,
            valor_fijo: isPercent ? null : valor,
            valor_porcentaje: isPercent ? valor : null,
          },
          { transaction: t }
        );

        await promocion_producto.create(
          {
            id_promocion: promo.id_promocion,
            id_producto,
          },
          { transaction: t }
        );
      } else {
        // actualizar valores y fechas
        promo.valor_fijo = isPercent ? null : valor;
        promo.valor_porcentaje = isPercent ? valor : null;
        if (startDate !== undefined) promo.fecha_inicio = startDate || null;
        if (endDate !== undefined) promo.fecha_termina = endDate || null;
        promo.activa = true;
        await promo.save({ transaction: t });
      }
    }

    await t.commit();
    return res.json({ message: "Descuentos aplicados correctamente" });
  } catch (error) {
    console.error("Error al aplicar descuentos:", error);
    await t.rollback();
    return res.status(500).json({ error: "Error al aplicar descuentos" });
  }
};
// controllers/promociones.js (mismo archivo)
exports.aplicarPreciosEscalonados = async (req, res) => {
  const tx = await sequelize.transaction();
  try {
    const { productIds, tiers, startDate, endDate } = req.body;

    // --- auth ---
    if (!req.user || !req.user.id_usuario) {
      await tx.rollback();
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    const user = await Usuario.findByPk(req.user.id_usuario, {
      attributes: ["id_rol"],
    });
    if (!user || user.id_rol !== 1) {
      await tx.rollback();
      return res
        .status(403)
        .json({
          message:
            "Solo los administradores pueden aplicar precios escalonados",
        });
    }

    // --- validaciones payload ---
    if (!Array.isArray(productIds) || productIds.length === 0) {
      await tx.rollback();
      return res.status(400).json({ message: "productIds requerido" });
    }
    if (!Array.isArray(tiers) || tiers.length === 0) {
      await tx.rollback();
      return res.status(400).json({ message: "tiers requerido" });
    }

    for (const t of tiers) {
      if (typeof t.cantidad_min !== "number" || t.cantidad_min <= 0) {
        await tx.rollback();
        return res.status(400).json({ message: "cantidad_min debe ser > 0" });
      }
      if (t.tipo === "percent") {
        if (typeof t.valor !== "number" || t.valor < 1 || t.valor > 100) {
          await tx.rollback();
          return res
            .status(400)
            .json({ message: "Porcentaje inválido (1–100)." });
        }
      } else if (t.tipo === "fixed") {
        if (typeof t.valor !== "number" || t.valor < 0) {
          await tx.rollback();
          return res
            .status(400)
            .json({ message: "Monto fijo inválido (≥ 0)." });
        }
      } else {
        await tx.rollback();
        return res
          .status(400)
          .json({ message: "tipo debe ser 'fixed' o 'percent'." });
      }
    }

    // --- comprobar productos (opcional, informativo) ---
    const count = await producto.count({ where: { id_producto: productIds } });
    if (count !== productIds.length) {
      console.warn("Algunos productIds no existen; se ignorarán en enlaces.");
    }

    // --- eliminar escalones existentes tipo 3 para esos productos ---
    const promosTipo3 = await promocion.findAll({
      where: { id_tipo_promo: 3 },
      include: [
        {
          model: producto,
          where: { id_producto: productIds },
          attributes: ["id_producto"],
          through: { attributes: [] },
        },
      ],
      transaction: tx,
    });
    const idsBorrar = promosTipo3.map((p) => p.id_promocion);
    if (idsBorrar.length) {
      await promocion_producto.destroy({
        where: { id_promocion: idsBorrar },
        transaction: tx,
      });
      await promocion.destroy({
        where: { id_promocion: idsBorrar },
        transaction: tx,
      });
    }

    // --- crear nuevos escalones ---
    for (const pid of productIds) {
      for (const e of tiers) {
        const isPercent = e.tipo === "percent";
        const promo = await promocion.create(
          {
            id_tipo_promo: 3,
            nombre_promocion: "Precio Escalonado",
            descripcion: `Mín ${e.cantidad_min}`,
            valor_fijo: isPercent ? null : e.valor,
            valor_porcentaje: isPercent ? e.valor : null,
            compra_min: e.cantidad_min,
            fecha_inicio: startDate || null,
            fecha_termina: endDate || null,
            activa: true,
            orden: e.cantidad_min, // útil para ordenar
          },
          { transaction: tx }
        );

        await promocion_producto.create(
          {
            id_promocion: promo.id_promocion,
            id_producto: pid,
          },
          { transaction: tx }
        );
      }
    }

    await tx.commit();
    return res.json({ message: "Precios escalonados aplicados correctamente" });
  } catch (error) {
    console.error("Error al aplicar precios escalonados:", error);
    await tx.rollback();
    return res
      .status(500)
      .json({ error: "Error al aplicar precios escalonados" });
  }
};
exports.crearPromocion = async (req, res) => {
  try {
    const {
      nombre_promocion,
      descripción,
      valor_fijo,
      valor_porcentaje,
      compra_min,
      fecha_inicio,
      fecha_termina,
      id_tipo_promo,
      banner_url,
      productos,
      orden,
    } = req.body;
    if (!req.user || !req.user.id_usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    const currentUserId = req.user.id_usuario;

    // Verificar si el usuario es administrador
    const user = await Usuario.findByPk(currentUserId, {
      attributes: ["id_rol"],
    });
    if (!user || user.id_rol !== 1) {
      return res
        .status(403)
        .json({ message: "Solo los administradores pueden crear promociones" });
    }
    const ordenNum = Number.isFinite(Number(orden)) ? Number(orden) : 0;

    const newPromocion = await promocion.create({
      nombre_promocion,
      descripción,
      valor_fijo: valor_fijo || null,
      valor_porcentaje: valor_porcentaje || null,
      compra_min: compra_min || null,
      fecha_inicio,
      fecha_termina,
      id_tipo_promo,
      banner_url,
      orden: ordenNum,
      activa: true,
    });
    if (productos && Array.isArray(productos)) {
      for (const id_producto of productos) {
        const product = await producto.findByPk(id_producto);
        if (product) {
          await promocion_producto.create({
            id_promocion: newPromocion.id_promocion,
            id_producto: id_producto,
          });
        }
      }
    }
    res.status(201).json({
      message: "Promoción creada correctamente",
      promocion: newPromocion,
    });
  } catch (error) {
    console.error("Error al crear la promoción:", error?.original || error);

    res.status(500).json({ error: "Error al crear la promoción" });
  }
};

exports.desactivarPromocion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user || !req.user.id_usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    const currentUserId = req.user.id_usuario;

    // Verificar si el usuario es administrador
    const user = await Usuario.findByPk(currentUserId, {
      attributes: ["id_rol"],
    });
    if (!user || user.id_rol !== 1) {
      return res.status(403).json({
        message: "Solo los administradores pueden desactivar promociones",
      });
    }

    const promocionToDeactivate = await promocion.findByPk(id);
    if (!promocionToDeactivate) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }

    promocionToDeactivate.activa = false;
    await promocionToDeactivate.save();
    res.json({ message: "Promoción desactivada correctamente" });
  } catch (error) {
    console.error("Error al desactivar la promoción:", error);
    res.status(500).json({ error: "Error al desactivar la promoción" });
  }
};

exports.activarPromocion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user || !req.user.id_usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    const currentUserId = req.user.id_usuario;
    // Verificar si el usuario es administrador
    const user = await Usuario.findByPk(currentUserId, {
      attributes: ["id_rol"],
    });
    if (!user || user.id_rol !== 1) {
      return res.status(403).json({
        message: "Solo los administradores pueden activar promociones",
      });
    }

    const promocionToActivate = await promocion.findByPk(id);
    if (!promocionToActivate) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }
    promocionToActivate.activa = true;
    await promocionToActivate.save();
    res.json({ message: "Promoción activada correctamente" });
  } catch (error) {
    console.error("Error al activar la promoción:", error);
    res.status(500).json({ error: "Error al activar la promoción" });
  }
};
exports.actualizarPromocion = async (req, res) => {
  try {
    const { id } = req.params;
    // PROBLEMA CORREGIDO: Agregado el campo 'activa' en la destructuración
    const {
      nombre_promocion,
      descripción,
      valor_fijo,
      valor_porcentaje,
      compra_min,
      fecha_inicio,
      fecha_termina,
      id_tipo_promo,
      banner_url,
      productos,
      orden,
      activa, // <-- ESTE CAMPO FALTABA
    } = req.body;

    if (!req.user || !req.user.id_usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    const currentUserId = req.user.id_usuario;

    // Verificar si el usuario es administrador
    const user = await Usuario.findByPk(currentUserId, {
      attributes: ["id_rol"],
    });
    if (!user || user.id_rol !== 1) {
      return res.status(403).json({
        message: "Solo los administradores pueden actualizar promociones",
      });
    }

    const promocionToUpdate = await promocion.findByPk(id);
    if (!promocionToUpdate) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }

    promocionToUpdate.nombre_promocion =
      nombre_promocion || promocionToUpdate.nombre_promocion;
    promocionToUpdate.descripción =
      descripción || promocionToUpdate.descripción;
    promocionToUpdate.valor_fijo =
      valor_fijo !== undefined ? valor_fijo : promocionToUpdate.valor_fijo;
    promocionToUpdate.compra_min =
      compra_min !== undefined ? compra_min : promocionToUpdate.compra_min;
    promocionToUpdate.valor_porcentaje =
      valor_porcentaje !== undefined
        ? valor_porcentaje
        : promocionToUpdate.valor_porcentaje;
    promocionToUpdate.fecha_inicio =
      fecha_inicio || promocionToUpdate.fecha_inicio;
    promocionToUpdate.fecha_termina =
      fecha_termina || promocionToUpdate.fecha_termina;
    promocionToUpdate.id_tipo_promo =
      id_tipo_promo || promocionToUpdate.id_tipo_promo;
    promocionToUpdate.orden =
      orden !== undefined ? orden : promocionToUpdate.orden;
    promocionToUpdate.banner_url = banner_url || promocionToUpdate.banner_url;
    promocionToUpdate.activa =
      activa !== undefined ? activa : promocionToUpdate.activa;

    await promocionToUpdate.save();

    if (productos && Array.isArray(productos)) {
      // Eliminar asociaciones existentes
      await promocion_producto.destroy({ where: { id_promocion: id } });
      // Crear nuevas asociaciones
      for (const id_producto of productos) {
        const product = await producto.findByPk(id_producto);
        if (product) {
          await promocion_producto.create({
            id_promocion: id,
            id_producto: id_producto,
          });
        }
      }
    }

    // OPCIONAL: Agregar logs para debugging
    console.log("Promoción actualizada:", {
      id: promocionToUpdate.id_promocion,
      nombre: promocionToUpdate.nombre_promocion,
      activa: promocionToUpdate.activa,
      orden: promocionToUpdate.orden,
    });

    res.json({
      message: "Promoción actualizada correctamente",
      promocion: promocionToUpdate,
    });
  } catch (error) {
    console.error("Error al actualizar la promoción:", error);
    res.status(500).json({ error: "Error al actualizar la promoción" });
  }
};

exports.productosPorPromocion = async (req, res) => {
  try {
    // 1) tomar solo el param, no el objeto entero
    const id_promocion = parseInt(req.params.id_promocion, 10);

    if (!Number.isInteger(id_promocion)) {
      return res.status(400).json({ message: "id_promocion inválido" });
    }

    // (opcional) validar que la promo exista
    const existe = await promocion.findByPk(id_promocion);
    if (!existe)
      return res.status(404).json({ message: "Promoción no encontrada" });

    const soloActivos =
      String(req.query.activos || "").toLowerCase() === "true";

    const rows = await producto.findAll({
      where: soloActivos ? { activo: true } : undefined,
      attributes: [
        "id_producto",
        "nombre",
        [sequelize.col("subcategoria.categoria.nombre"), "categoria"],
        [sequelize.col("subcategoria.nombre"), "subcategoria"],
      ],
      include: [
        // Join con promoción para filtrar por id_promocion
        {
          model: promocion,
          where: { id_promocion }, // <- es un número
          attributes: [],
          through: { attributes: [] },
          required: true,
        },
        // Subcategoria -> Categoria (usando tus alias reales)
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: [],
          required: true,
          include: [
            {
              model: categoria,
              as: "categoria",
              attributes: [],
              required: true,
            },
          ],
        },
      ],
      order: [["id_producto", "ASC"]],
      raw: true, // para que Sequelize.col salga como campos planos
    });

    return res.json(rows); // [{ id_producto, nombre, categoria, subcategoria }]
  } catch (err) {
    console.error("Error listando productos básicos por promoción:", err);
    return res
      .status(500)
      .json({ message: "Error interno al listar productos de la promoción" });
  }
};
