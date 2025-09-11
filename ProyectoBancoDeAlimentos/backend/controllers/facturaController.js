const {Sequelize} = require('sequelize');
const { factura, factura_detalle, producto, pedido} = require("../models");

exports.getAllFacturasByUserwithDetails = async (req, res) => {
  try {
    // Toma el id del usuario autenticado del middleware
    const id_usuario = req.user?.id_usuario ?? req.auth?.userId;
    if (!id_usuario) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const facturasList = await factura.findAll({
      // factura no tiene id_usuario; filtramos por el pedido asociado
      include: [
        {
          model: pedido,
          attributes: ["id_pedido", "id_usuario"],
          where: { id_usuario },
          required: true, // fuerza el join para filtrar por usuario
        },
        {
          // NO uses "as" porque en index.js no definiste alias para esta relación
          model: factura_detalle,
          attributes: [
            "id_factura_detalle",
            "id_producto",
            "cantidad_unidad_medida",
            "subtotal_producto",
          ],
          include: [
            {
              // Tampoco uses "as" aquí: en index.js no hay alias
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
