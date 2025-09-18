const db = require("../models");

async function seed(req, res) {
  try {
    // Asegurar que exista al menos un metodo de pago válido
    let metodoDefault = await db.metodo_pago.findOne();
    if (!metodoDefault) {
      // Crear un metodo de pago por defecto si no existe
      metodoDefault = await db.metodo_pago.create({
        id_usuario: 1,
        brand_tarjeta: "DEFAULT",
        tarjeta_ultimo: "0000",
        vencimiento_mes: 1,
        vencimiento_ano: 2099,
        nombre_en_tarjeta: "Sistema",
        id_direccion_facturacion: 1,
        token_pago: "tok_default_0000",
        metodo_predeterminado: true,
        fecha_creacion: new Date(),
      });
    }

    const sample = [
      { id_pedido: 1, fecha_emision: new Date(), total: 120.5 },
      { id_pedido: 2, fecha_emision: new Date(), total: 85.0 },
      { id_pedido: 3, fecha_emision: new Date(), total: 45.99 },
    ];

    for (const rec of sample) {
      // asignar id_metodo_pago al crear la factura
      const payload = Object.assign({}, rec, {
        id_metodo_pago: metodoDefault.id_metodo_pago,
      });
      const [row, created] = await db.factura.findOrCreate({
        where: { id_pedido: rec.id_pedido },
        defaults: payload,
      });
      // Si la factura ya existía pero no tiene id_metodo_pago, actualizarla
      if (!row.id_metodo_pago) {
        row.id_metodo_pago = metodoDefault.id_metodo_pago;
        await row.save();
      }
    }

    res.status(201).json({ message: "Facturas insertadas" });
  } catch (e) {
    console.error("Seed error:", e);
    res.status(500).json({ message: "Error al insertar facturas" });
  }
}

module.exports = seed;
