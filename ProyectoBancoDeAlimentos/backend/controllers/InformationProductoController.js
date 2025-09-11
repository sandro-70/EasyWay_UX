// Usa los nombres reales de tus modelos en ../models/index.js
const { valoracion_producto, producto, Usuario, favorito_producto, sequelize } = require('../models');
const { fn, col, Op } = require("sequelize");

// Helper para sacar el id del usuario autenticado desde el token
function getAuthUserId(req) {
  return req.user?.id_usuario ?? req.auth?.userId ?? req.userId ?? null;
}

/* =============================
   1) VALORACIONES (GET)
   GET /api/productos/:id/valoraciones
   - No requiere token (puedes envolver en auth si quieres)
   - Devuelve array: [{ id_valoracion_producto, id_usuario, puntuacion, comentario, fecha_creacion }, ...]
============================= */
// controllers/InformationProductoController.js (o donde tengas este controller)

// controllers/InformationProductoController.js


exports.listValoracionesByProducto = async (req, res) => {
  try {
    const id_producto = Number(req.params.id);
    if (!id_producto) {
      return res.status(400).json({ error: "id de producto inválido" });
    }

    // Verifica que exista el producto
    const prod = await producto.findByPk(id_producto, {
      attributes: ["id_producto", "nombre"],
    });
    if (!prod) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // ----- 1) Listado de valoraciones (con datos básicos del usuario si existe la asociación)
    // Para que el include funcione, asegúrate de tener en tu models/index.js:
    // valoracion_producto.belongsTo(Usuario, { foreignKey: 'id_usuario' });
    // Usuario.hasMany(valoracion_producto, { foreignKey: 'id_usuario' });
    const valoraciones = await valoracion_producto.findAll({
      where: { id_producto },
      attributes: [
        "id_valoracion_producto",
        "id_usuario",
        "puntuacion",
        "comentario",
        "fecha_creacion",
      ],
      include: [
        {
          model: Usuario,
          attributes: ["id_usuario", "nombre", "apellido"],
          required: false,
        },
      ],
      order: [["fecha_creacion", "DESC"]],
    });

    // ----- 2) Stats: promedio y total
    const statsArr = await valoracion_producto.findAll({
      where: { id_producto },
      attributes: [
        [fn("AVG", col("puntuacion")), "avg"],
        [fn("COUNT", col("*")), "total"],
      ],
      raw: true,
    });
    const stats = statsArr?.[0] || { avg: null, total: 0 };
    const avgRating = stats.avg ? Number(parseFloat(stats.avg).toFixed(2)) : 0;
    const totalReviews = Number(stats.total || 0);

    // ----- 3) Distribución 1..5
    const distRaw = await valoracion_producto.findAll({
      where: { id_producto },
      attributes: ["puntuacion", [fn("COUNT", col("*")), "count"]],
      group: ["puntuacion"],
      raw: true,
    });
    const dist = [0, 0, 0, 0, 0]; // [1★,2★,3★,4★,5★]
    distRaw.forEach((r) => {
      const p = Number(r.puntuacion);
      if (p >= 1 && p <= 5) dist[p - 1] = Number(r.count);
    });

    // ----- 4) Respuesta
    return res.json({
      producto: {
        id_producto: prod.id_producto,
        nombre: prod.nombre,
      },
      resumen: {
        avgRating,
        totalReviews,
        dist, // [1★,2★,3★,4★,5★]
      },
      valoraciones: valoraciones.map((v) => ({
        id_valoracion_producto: v.id_valoracion_producto,
        id_usuario: v.id_usuario,
        usuario: v.Usuario
          ? {
              id_usuario: v.Usuario.id_usuario,
              nombre: v.Usuario.nombre,
              apellido: v.Usuario.apellido,
            }
          : null,
        puntuacion: v.puntuacion,
        comentario: v.comentario,
        fecha_creacion: v.fecha_creacion,
      })),
    });
  } catch (err) {
    console.error("[listValoracionesByProducto] Error:", err);
    return res.status(500).json({ error: "Error al obtener valoraciones" });
  }
};

/* =============================
   2) VALORACIONES (POST)
   POST /api/productos/:id/valoraciones
   Body: { puntuacion: 1..5, comentario?: string }
   - Requiere token
   - Crea o actualiza (upsert) la valoración del usuario para ese producto
============================= */
exports.addOrUpdateValoracion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_usuario = getAuthUserId(req);
    if (!id_usuario) {
      await t.rollback();
      return res.status(401).json({ error: 'No autenticado' });
    }

    const id_producto = Number(req.params.id);
    if (!id_producto) {
      await t.rollback();
      return res.status(400).json({ error: 'id de producto inválido' });
    }

    const { puntuacion, comentario = '' } = req.body || {};
    const punt = Number(puntuacion);

    if (!Number.isInteger(punt) || punt < 1 || punt > 5) {
      await t.rollback();
      return res.status(400).json({ error: 'puntuacion debe ser un entero entre 1 y 5' });
    }

    // Validar producto
    const prod = await producto.findByPk(id_producto, { transaction: t });
    if (!prod) {
      await t.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Upsert: si existe, actualiza; si no, crea
    const existing = await valoracion_producto.findOne({
      where: { id_usuario, id_producto },
      transaction: t
    });

    let row;
    if (existing) {
      row = await existing.update(
        { puntuacion: punt, comentario: comentario?.toString().slice(0, 255) || null },
        { transaction: t }
      );
    } else {
      row = await valoracion_producto.create(
        {
          id_usuario,
          id_producto,
          puntuacion: punt,
          comentario: comentario?.toString().slice(0, 255) || null,
          fecha_creacion: new Date(),
        },
        { transaction: t }
      );
    }

    // (Opcional) Actualizar promedio en producto.estrellas si ese campo existe en tu modelo
     try {
       const stats = await valoracion_producto.findAll({
         where: { id_producto },
         attributes: [[sequelize.fn('AVG', sequelize.col('puntuacion')), 'avg']],
         raw: true,
         transaction: t
       });
       const avg = Number(stats?.[0]?.avg || 0);
       if (!Number.isNaN(avg)) {
         await prod.update({ estrellas: avg }, { transaction: t });
       }
     } catch { /* no-op */ }

    await t.commit();
    return res.status(201).json(row);
  } catch (err) {
    await t.rollback();
    console.error('[addOrUpdateValoracion] Error:', err);
    return res.status(500).json({ error: 'Error al guardar valoración' });
  }
};

/* =============================
   3) FAVORITOS (ADD)
   POST /api/productos/:id/favoritos
   - Requiere token
   - Agrega producto a favoritos del usuario (idempotente)
============================= */
exports.addFavorito = async (req, res) => {
  try {
    const id_usuario = getAuthUserId(req);
    if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });

    const id_producto = Number(req.params.id);
    if (!id_producto) return res.status(400).json({ error: 'id de producto inválido' });

    const prod = await producto.findByPk(id_producto, { attributes: ['id_producto'] });
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

    const [fav, created] = await favorito_producto.findOrCreate({
      where: { id_usuario, id_producto },
      defaults: { id_usuario, id_producto, fecha_creacion: new Date() },
    });

    return res.status(created ? 201 : 200).json({
      ok: true,
      message: created ? 'Agregado a favoritos' : 'Ya estaba en favoritos',
      favorito: fav,
    });
  } catch (err) {
    console.error('[addFavorito] Error:', err);
    return res.status(500).json({ error: 'Error al agregar favorito' });
  }
};

/* =============================
   (BONUS) FAVORITOS (DELETE)
   DELETE /api/productos/:id/favoritos
   - Requiere token
============================= */
exports.removeFavorito = async (req, res) => {
  try {
    const id_usuario = getAuthUserId(req);
    if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });

    const id_producto = Number(req.params.id);
    if (!id_producto) return res.status(400).json({ error: 'id de producto inválido' });

    const deleted = await favorito_producto.destroy({ where: { id_usuario, id_producto } });
    return res.json({
      ok: true,
      message: deleted ? 'Eliminado de favoritos' : 'No estaba en favoritos',
    });
  } catch (err) {
    console.error('[removeFavorito] Error:', err);
    return res.status(500).json({ error: 'Error al eliminar favorito' });
  }
};

/* =============================
   (BONUS) FAVORITOS (LIST)
   GET /api/favoritos
   - Requiere token
============================= */
exports.listMisFavoritos = async (req, res) => {
  try {
    const id_usuario = getAuthUserId(req);
    if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });

    const rows = await favorito_producto.findAll({
      where: { id_usuario },
      attributes: ['id_favorito', 'id_producto', 'fecha_creacion'],
      include: [
        { model: producto, attributes: ['id_producto', 'nombre', 'precio_base', 'unidad_medida'] },
      ],
      order: [['fecha_creacion', 'DESC']],
    });

    return res.json(rows);
  } catch (err) {
    console.error('[listMisFavoritos] Error:', err);
    return res.status(500).json({ error: 'Error al obtener favoritos' });
  }
};
