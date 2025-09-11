const {Sequelize} = require('sequelize');
const { factura, factura_detalle, producto, pedido, Usuario, estado_pedido, valoracion_producto } = require("../models");

exports.getTopProductosUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const topProductos = await factura_detalle.findAll({
      attributes: [
        ["id_producto", "id_producto"],
        [Sequelize.fn("SUM", Sequelize.col("factura_detalle.cantidad_unidad_medida")), "total_comprado"]
      ],
      include: [
        {
          model: factura,
          attributes: [],
          include: [
            {
              model: pedido,
              attributes: [],
              where: { id_usuario },
              include: [
                {
                  model: estado_pedido,
                  attributes: [],
                  where: { nombre_pedido: "Enviado" }
                }
              ]
            }
          ]
        },
        {
          model: producto,
          attributes: ["id_producto", "nombre"]
        }
      ],
      group: ["factura_detalle.id_producto", "producto.id_producto", "producto.nombre"],
      order: [[Sequelize.literal("total_comprado"), "DESC"]],
      limit: 3,
      subQuery: false
    });



    res.json(topProductos);
  } catch (error) {
    console.error("Error al obtener top productos:", error);
    res.status(500).json({ error: "Error al obtener top productos del usuario" });
  }
};

exports.getProductosRecomendados = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const user = await Usuario.findOne({ where: { id_usuario } });
    if (!user) {
      return res.status(404).json({message : "Usuario no encontrado!" });
    }

    const recomendados = await valoracion_producto.findAll({
      attributes: ["id_producto", "puntuacion", "comentario"],
      where: { id_usuario },
      include: [
        {
          model: producto,
          attributes: ["nombre", "precio_base"]
        }
      ],
      order: [["puntuacion", "DESC"]],
      limit: 3
    });

    res.json(recomendados);
  } catch (error) {
    console.error("Error al obtener productos recomendados:", error);
    res.status(500).json({ error: "Error al obtener productos recomendados" });
  }
};

exports.getDiasCompra = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const user = await Usuario.findOne({ where: { id_usuario } });
    if (!user) {
      return res.status(404).json({ message : "Usuario no encontrado" });
    }

    const diasCompra = await pedido.findAll({
      attributes: [
        //DOW = 0-Lunes , 1-Martes , 2-Miercoles ...
        [Sequelize.fn("EXTRACT", Sequelize.literal("DOW FROM fecha_pedido")), "dia_semana"],
        [Sequelize.fn("COUNT", Sequelize.col("id_pedido")), "total_pedidos"]
      ],
      where: { id_usuario },
      group: [Sequelize.literal("dia_semana")],
      order: [[Sequelize.literal("total_pedidos"), "DESC"]]
    });

    res.json(diasCompra);
  } catch (error) {
    console.error("Error al obtener días de compra:", error);
    res.status(500).json({ error: "Error al obtener días de compra" });
  }
};

exports.getTotalAhorrado = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const resultado = await pedido.findOne({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("descuento")), "total_ahorrado"]
      ],
      where: { id_usuario },
      include: [
        {
          model: estado_pedido,
          attributes: [],
          where: { nombre_pedido: "Enviado" }
        }
      ],
      raw: true
    });

    res.json({ total_ahorrado: resultado.total_ahorrado ?? 0 });
  } catch (error) {
    console.error("Error al calcular total ahorrado:", error);
    res.status(500).json({ error: "Error al calcular el ahorro del usuario!" });
  }
};
