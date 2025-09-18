const db = require("../models");

async function seed(req, res) {
  try {
    const sample = [
      {
        id_factura: 1,
        id_producto: 1,
        cantidad_unidad_medida: 2,
        subtotal_producto: 50.25,
      },
      {
        id_factura: 1,
        id_producto: 2,
        cantidad_unidad_medida: 1,
        subtotal_producto: 70.25,
      },
      {
        id_factura: 2,
        id_producto: 3,
        cantidad_unidad_medida: 3,
        subtotal_producto: 85.0,
      },
      {
        id_factura: 1,
        id_producto: 3,
        cantidad_unidad_medida: 1,
        subtotal_producto: 15.99,
      },
      {
        id_factura: 1,
        id_producto: 4,
        cantidad_unidad_medida: 2,
        subtotal_producto: 40.0,
      },
      {
        id_factura: 1,
        id_producto: 5,
        cantidad_unidad_medida: 2,
        subtotal_producto: 40.0,
      },
      {
        id_factura: 3,
        id_producto: 1,
        cantidad_unidad_medida: 1,
        subtotal_producto: 25.0,
      },
    ];

    for (const rec of sample) {
      const [row, created] = await db.factura_detalle.findOrCreate({
        where: { id_factura: rec.id_factura, id_producto: rec.id_producto },
        defaults: rec,
      });
    }
    res.status(201).json({ message: "Detalles de factura insertados" });
  } catch (e) {
    console.error("Seed error:", e);
    res.status(500).json({ message: "Error al insertar detalles de factura" });
  }
}

module.exports = seed;
