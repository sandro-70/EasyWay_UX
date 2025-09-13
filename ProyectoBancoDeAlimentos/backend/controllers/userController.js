const { Usuario, pedido, factura} = require('../models');
const { fn, col } = require('sequelize');

exports.estadosUsuarios = async (req, res) => {
  try {
    const resultado = await Usuario.findAll({
      attributes: [
        'activo',
        [fn('COUNT', col('id_usuario')), 'cantidad']
      ],
      group: ['activo']
    });

    const respuesta = {
      activos: 0,
      inactivos: 0
    };

    resultado.forEach(r => {
      if (r.activo) {
        respuesta.activos = r.getDataValue('cantidad');
      } else {
        respuesta.inactivos = r.getDataValue('cantidad');
      }
    });

    res.json(respuesta);
  } catch (error) {
    console.error("Error al contar usuarios:", error);
    res.status(500).json({ error: "Error interno al contar usuarios" });
  }
};

exports.promedioGastoUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    //promedio
    const resultado = await factura.findOne({
      attributes: [[fn('AVG', col('total')), 'promedio_gasto']],
      include: [{
        model: pedido,
        attributes: [],
        where: { id_usuario }
      }],
      raw: true
    });

    res.json({
      id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      promedio_gasto: parseFloat(resultado.promedio_gasto) || 0
    });

  } catch (error) {
    console.error("Error al calcular promedio de gasto del usuario:", error);
    res.status(500).json({ error: "Error interno al calcular promedio de gasto" });
  }
};

exports.contarPedidosUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const user = await Usuario.findByPk(id_usuario);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    //contar
    const cantidadPedidos = await pedido.count({
      where: { id_usuario }
    });

    res.json({
      id_usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      total_pedidos: cantidadPedidos
    });
  } catch (error) {
    console.error("Error al contar pedidos del usuario:", error);
    res.status(500).json({ error: "Error interno al contar pedidos" });
  }
};