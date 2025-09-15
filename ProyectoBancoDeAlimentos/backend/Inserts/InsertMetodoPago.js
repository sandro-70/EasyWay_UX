const db = require("../models");

async function seed(req, res) {
  const sample = [
    {
      id_usuario: 1,
      brand_tarjeta: "VISA",
      tarjeta_ultimo: "4242",
      vencimiento_mes: 12,
      vencimiento_ano: 2027,
      nombre_en_tarjeta: "Admin Principal",
      id_direccion_facturacion: 1,
      token_pago: "tok_visa_4242",
      metodo_predeterminado: true,
      fecha_creacion: new Date(),
    },
    {
      id_usuario: 2,
      brand_tarjeta: "MASTERCARD",
      tarjeta_ultimo: "5555",
      vencimiento_mes: 6,
      vencimiento_ano: 2026,
      nombre_en_tarjeta: "Usuario Uno",
      id_direccion_facturacion: 2,
      token_pago: "tok_master_5555",
      metodo_predeterminado: false,
      fecha_creacion: new Date(),
    },
    {
      id_usuario: 3,
      brand_tarjeta: "AMEX",
      tarjeta_ultimo: "0005",
      vencimiento_mes: 9,
      vencimiento_ano: 2028,
      nombre_en_tarjeta: "Usuario Dos",
      id_direccion_facturacion: 2,
      token_pago: "tok_amex_0005",
      metodo_predeterminado: false,
      fecha_creacion: new Date(),
    },
  ];
  try {
    let inserted = [];
    for (const rec of sample) {
      const [row, created] = await db.metodo_pago.findOrCreate({
        where: {
          id_usuario: rec.id_usuario,
          tarjeta_ultimo: rec.tarjeta_ultimo,
        },
        defaults: rec,
      });
      if (created) {
        inserted.push(row);
      }
    }
    res.status(201).json({
      message: "Métodos de pago insertados correctamente",
      result: inserted,
    });
  } catch (e) {
    console.error("Seed error:", e);
    res.status(500).json({ message: "Error al insertar métodos de pago" });
  }
}

module.exports = seed;
