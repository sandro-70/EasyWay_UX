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
