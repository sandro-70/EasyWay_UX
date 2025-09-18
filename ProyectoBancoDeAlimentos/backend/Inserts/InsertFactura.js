const db = require("../models");

async function seed(req, res) {
  try {
    const sample = [
      { id_pedido: 1, fecha_emision: new Date(), total: 120.5 },
      { id_pedido: 2, fecha_emision: new Date(), total: 85.0 },
      { id_pedido: 3, fecha_emision: new Date(), total: 45.99 },
    ];

    for (const rec of sample) {
      const [row, created] = await db.factura.findOrCreate({
        where: { id_pedido: rec.id_pedido },
        defaults: rec,
      });
    }
    res.status(201).json({ message: "Facturas insertadas" });
  } catch (e) {
    console.error("Seed error:", e);
    res.status(500).json({ message: "Error al insertar facturas" });
  }
}

module.exports = seed;
