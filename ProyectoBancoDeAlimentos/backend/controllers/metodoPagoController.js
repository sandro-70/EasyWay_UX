// controllers/metodoPago.controller.js
const { metodo_pago, sequelize } = require('../models');

// Helper para sacar el id del usuario autenticado
function getAuthUserId(req) {
  return req.user?.id_usuario ?? req.auth?.userId ?? null;
}

// GET /api/metodo-pago
const getAllMetodosDePago = async (req, res) => {
  try {
    const id_usuario = getAuthUserId(req);
    if (!id_usuario) return res.status(401).json({ message: 'No autenticado' });

    const metodos = await metodo_pago.findAll({
      where: { id_usuario },
      order: [['id_metodo_pago', 'ASC']],
    });

    // Devolver [] si no hay (más práctico que 404 para listados)
    return res.json(metodos);
  } catch (error) {
    console.error('[getAllMetodosDePago] Error:', error);
    return res.status(500).json({ error: 'Error al obtener métodos de pago' });
  }
};

// POST /api/metodo-pago
const createNuevoMetodoPago = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_usuario = getAuthUserId(req);
    if (!id_usuario) {
      await t.rollback();
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Campos esperados según tu modelo
    const {
      brand_tarjeta,
      tarjeta_ultimo,
      vencimiento_mes,
      vencimiento_ano,
      nombre_en_tarjeta,
      id_direccion_facturacion,
      token_pago,                 // <- requerido
      metodo_predeterminado = false,
    } = req.body;

    if (!token_pago) {
      await t.rollback();
      return res.status(400).json({ message: 'token_pago es obligatorio' });
    }

    // Si se crea como predeterminado, desmarca los otros primero
    if (metodo_predeterminado === true) {
      await metodo_pago.update(
        { metodo_predeterminado: false },
        { where: { id_usuario }, transaction: t }
      );
    } else {
      // Si no marca default pero es el PRIMERO del usuario, lo marcamos default
      const count = await metodo_pago.count({ where: { id_usuario }, transaction: t });
      if (count === 0) {
        req.body.metodo_predeterminado = true;
      }
    }

    const nuevo = await metodo_pago.create(
      {
        id_usuario,
        brand_tarjeta,
        tarjeta_ultimo,
        vencimiento_mes,
        vencimiento_ano,
        nombre_en_tarjeta,
        id_direccion_facturacion,
        token_pago,
        metodo_predeterminado: req.body.metodo_predeterminado ?? metodo_predeterminado,
        fecha_creacion: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json(nuevo);
  } catch (error) {
    await t.rollback();
    console.error('[createNuevoMetodoPago] Error:', error);
    return res.status(400).json({ error: 'Error al crear método de pago' });
  }
};

// DELETE /api/metodo-pago/:id
const deleteMetodoPago = async (req, res) => {
  try {
    const id_usuario = getAuthUserId(req);
    if (!id_usuario) return res.status(401).json({ message: 'No autenticado' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: 'id inválido' });
    }

    const deleted = await metodo_pago.destroy({
      where: { id_metodo_pago: id, id_usuario },
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Método de pago no encontrado' });
    }
    return res.json({ message: 'Método de pago eliminado' });
  } catch (error) {
    console.error('[deleteMetodoPago] Error:', error);
    return res.status(500).json({ error: 'Error al eliminar método de pago' });
  }
};

// PATCH /api/metodo-pago/default/:id
const establecerComoDefault = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_usuario = getAuthUserId(req);
    if (!id_usuario) {
      await t.rollback();
      return res.status(401).json({ message: 'No autenticado' });
    }

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'id inválido' });
    }

    // Desmarcar todos los métodos de ese usuario
    await metodo_pago.update(
      { metodo_predeterminado: false },
      { where: { id_usuario }, transaction: t }
    );

    // Marcar el seleccionado como predeterminado (asegura pertenencia)
    const [rows] = await metodo_pago.update(
      { metodo_predeterminado: true },
      { where: { id_metodo_pago: id, id_usuario }, transaction: t }
    );

    if (rows === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Método de pago no encontrado' });
    }

    await t.commit();
    return res.json({ message: 'Método de pago predeterminado actualizado' });
  } catch (error) {
    await t.rollback();
    console.error('[establecerComoDefault] Error:', error);
    return res.status(500).json({ error: 'Error al actualizar método predeterminado' });
  }
};

// CommonJS correcto
module.exports = {
  getAllMetodosDePago,
  createNuevoMetodoPago,
  deleteMetodoPago,
  establecerComoDefault,
};
