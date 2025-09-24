const {Sequelize} = require('sequelize');
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
