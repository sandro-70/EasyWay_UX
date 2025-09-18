const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const { historial_cupon, cupon, Usuario } = require("../models");
const { Op, fn, col } = require("sequelize");


exports.allCupones = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const userId = parseInt(id_usuario, 10);

        if (isNaN(userId)) {
            return res.status(400).json({ message: "ID de usuario inválido." });
        }

        const cuponesUsuario = await historial_cupon.findAll({
            where: { id_usuario: userId },
            include: [
                {
                    model: cupon,
                    as: "cupon",
                    attributes: ["codigo", "descripcion", "activo"],
                },
            ],
            order: [["fecha_usado"]],
            nest: true,
            raw: true,
        });

        if (cuponesUsuario.length === 0) {
            return res.status(404).json({ message: "No se encontraron cupones para este usuario." });
        }

        const resultado = cuponesUsuario.map((hc) => ({
            codigo: hc.cupon.codigo,
            descripcion: hc.cupon.descripcion,
            activo: hc.cupon.activo,
            fecha_usado: hc.fecha_usado,
        }));

        return res.json(resultado);
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Error al obtener los cupones del usuario" });
    }
};

exports.crearCupon = async (req, res) => {
  const { nombre, codigo, tipo, descripcion, valor, termina_en, uso_por_usuario } = req.body;
  const { id_usuario } = req.params;

  try {
    const user = await Usuario.findOne({ where: { id_usuario } });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado!" });
    }

    if (user.id_rol !== 1) {
      return res.status(403).json({ message: "No tienes permiso para crear un cupon!" });
    }

    const existe = await cupon.findOne({ where: { codigo } });
    if (existe) {
      return res.status(400).json({ message: "El código de cupón ya existe!" });
    }

    const cupon_creado = await cupon.create({
      nombre,
      codigo,
      tipo,
      descripcion,
      valor,
      termina_en,
      uso_por_usuario,
      activo: true
    });

    return res.status(201).json({
      message: "Cupón creado correctamente!",
      cupon: cupon_creado
    });

    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al intentar crear un cupón!" });
  }
};


exports.addCuponUsuario = async (req, res) => {
  const { codigo } = req.body;
  const { id_usuario } = req.params;

  try {
    const cuponEncontrado = await cupon.findOne({ where: { codigo, activo: true } });
    if (!cuponEncontrado) {
      return res.status(404).json({ message: 'Cupón no encontrado o inactivo' });
    }

    const yaUsado = await historial_cupon.findOne({
      where: { id_usuario, id_cupon: cuponEncontrado.id_cupon }
    });

    if (yaUsado) {
      return res.status(400).json({ message: 'Ya usaste este cupón' });
    }

    const registro = await historial_cupon.create({
      id_usuario,
      id_cupon: cuponEncontrado.id_cupon,
      fecha_uso: new Date()
    });

    return res.status(201).json({
      message: 'Cupón agregado al usuario correctamente',
      cupon: cuponEncontrado,
      historial: registro
    });
  } catch (error) {
    console.error('Error agregando cupón al usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getAllCupones = async (req, res) => {
    try {
        const cupones = await cupon.findAll({
            attributes: [
                "id_cupon",
                "codigo",
                "descripcion",
                "tipo",
                "valor",
                "uso_por_usuario",
                "termina_en",
                "activo",
                [
                    sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM historial_cupon AS h
                        WHERE h.id_cupon = cupon.id_cupon
                    )`),
                    "usos_actuales",
                ],
            ],
            order: [["id_cupon", "ASC"]],
        });

        if (!cupones || cupones.length === 0) {
            return res.status(404).json({ message: "No se encontraron cupones." });
        }

        const resultado = cupones.map((c) => {
            const ahora = new Date();
            const fechaExpiracion = new Date(c.termina_en);
            const usosActuales = parseInt(c.dataValues.usos_actuales) || 0;

            let estado = "activo";
            if (!c.activo) estado = "inactivo";
            else if (fechaExpiracion < ahora) estado = "expirado";
            else if (usosActuales >= c.uso_por_usuario) estado = "usado";

            return {
                id_cupon: c.id_cupon,
                codigo: c.codigo,
                descripcion: c.descripcion,
                tipo: c.tipo,
                valor: c.valor,
                uso_maximo_por_usuario: c.uso_por_usuario,
                usos_actuales: usosActuales,
                fecha_expiracion: c.termina_en,
                activo: c.activo,
                estado,
            };
        });

        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener cupones." });
    }
};

exports.desactivarCupon = async (req, res) => {
  try {
    const { id_cupon } = req.params;

    const cup = await cupon.findOne({ where: { id_cupon } });

    if (!cup) {
      return res.status(404).json({ error: "No se pudo encontrar el cupón!" });
    }

    cup.activo = false;
    await cup.save();

    res.json({ message: "Cupón desactivado correctamente", id_cupon });
  } catch (error) {
    console.error("Error al desactivar cupón:", error);
    res.status(500).json({ error: "Error interno al desactivar el cupón" });
  }
};

exports.editarCupon = async (req, res) => {
  const { id_cupon } = req.params;
  const { codigo, descripcion, tipo, valor, uso_por_usuario, termina_en, activo } = req.body;

  try {
    const cuponz = await cupon.findByPk(id_cupon);
    if (!cuponz) return res.status(404).json({ message: 'Cupon no encontrado' });

    const updates = {};

    if (codigo !== undefined) {
      const cod = String(codigo).trim();
      if (!cod) return res.status(400).json({ message: 'codigo no puede estar vacío' });

      const duplicado = await cupon.count({
        where: { codigo: cod, id_cupon: { [Op.ne]: id_cupon } }
      });
      if (duplicado) {
        return res.status(409).json({ message: 'El código de cupón ya existe' });
      }
      updates.codigo = cod;
    }

    if (descripcion !== undefined) updates.descripcion = String(descripcion).trim();

    if (tipo !== undefined) {
      const t = String(tipo).trim().toLowerCase();
      updates.tipo = t;
    }

    if (valor !== undefined) {
      const v = Number(valor);
      if (Number.isNaN(v) || v < 0) return res.status(400).json({ message: 'valor debe ser >= 0' });
      updates.valor = v;
    }

    if (uso_por_usuario !== undefined) {
      const u = Number(uso_por_usuario);
      if (!Number.isInteger(u) || u < 0) return res.status(400).json({ message: 'uso_por_usuario debe ser entero >= 0' });
      updates.uso_por_usuario = u;
    }

    if (termina_en !== undefined) {
      const d = String(termina_en);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d))) {
        return res.status(400).json({ message: 'termina_en debe ser YYYY-MM-DD' });
      }
      updates.termina_en = d;
    }

    if (activo !== undefined) {
      if (typeof activo !== 'boolean') return res.status(400).json({ message: 'activo debe ser booleano' });
      updates.activo = activo;
    }

    await cuponz.update(updates);
    return res.json({ message: 'Cupón actualizado', data: cuponz });

  } catch (err) {
    console.error('Error editando cupón:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Código de cupón duplicado' });
    }
    return res.status(500).json({ message: 'Error interno al editar cupón' });
  }
};
