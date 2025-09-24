const {Sequelize, fn, col} = require('sequelize');
const { factura, factura_detalle, producto, pedido} = require("../models");

exports.getAllFacturasByUserwithDetails = async (req, res) => {
  try {
    const id_usuario = req.user?.id_usuario ?? req.auth?.userId;
    if (!id_usuario) return res.status(401).json({ message: "No autenticado" });

    const facturasList = await factura.findAll({
      include: [
        {
          model: pedido,
          attributes: ["id_pedido", "id_usuario", "descuento"],
          where: { id_usuario },
          required: true,
        },
        {
          model: factura_detalle,
          attributes: [
            "id_factura_detalle",
            "id_producto",
            "cantidad_unidad_medida",
            "subtotal_producto",
          ],
          include: [
            {
              model: producto,
              attributes: ["id_producto", "nombre", "unidad_medida", "precio_base"],
            },
          ],
        },
      ],
      order: [["id_factura", "DESC"]],
    });

    return res.json(facturasList);
  } catch (error) {
    console.error("[getAllFacturasByUserwithDetails] Error:", error);
    return res.status(500).json({ error: "Error al obtener facturas" });
  }
};

exports.getResumenFacturasUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const result = await factura.findAll({
      attributes: [
        [fn("COUNT", col("factura.id_factura")), "total_facturas"],
        [fn("SUM", col("factura.total")), "suma_facturas"]
      ],
      include: [
        {
          model: pedido,
          attributes: [],
          where: { id_usuario }
        }
      ],
      raw: true
    });

    return res.json(result[0]);
  } catch (error) {
    console.error("Error obteniendo resumen de facturas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};