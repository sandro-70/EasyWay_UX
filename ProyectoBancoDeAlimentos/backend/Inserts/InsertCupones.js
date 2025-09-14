const db = require("../models");

async function insertCuponesSeed(req, res) {
  const cupones = [
    {
      codigo: "DESCUENTO10",
      descripcion: "10% de descuento en tu compra",
      tipo: "porcentaje",
      valor: 10,
      uso_por_usuario: 1,
      termina_en: "2025-12-31",
      activo: true,
    },
    {
      codigo: "ENVIOGRATIS",
      descripcion: "Envío gratis en compras mayores a L.500",
      tipo: "envio",
      valor: 0,
      uso_por_usuario: 1,
      termina_en: "2025-12-31",
      activo: true,
    },
    {
      codigo: "BIENVENIDO20",
      descripcion: "20% de descuento para nuevos usuarios",
      tipo: "porcentaje",
      valor: 20,
      uso_por_usuario: 1,
      termina_en: "2025-12-31",
      activo: true,
    },
    {
      codigo: "COMPRA100",
      descripcion: "L.100 de descuento en compras mayores a L.1000",
      tipo: "monto",
      valor: 100,
      uso_por_usuario: 1,
      termina_en: "2025-12-31",
      activo: true,
    },
    {
      codigo: "CUPON5",
      descripcion: "5% de descuento en cualquier compra",
      tipo: "porcentaje",
      valor: 5,
      uso_por_usuario: 2,
      termina_en: "2025-12-31",
      activo: true,
    },
  ];

  try {
    for (const cupon of cupones) {
      const exists = await db.cupon.findOne({
        where: { codigo: cupon.codigo },
      });
      if (!exists) {
        await db.cupon.create(cupon);
      }
    }
    if (res) {
      res.status(200).json({ message: "Cupones insertados correctamente." });
    } else {
      console.log("Cupones insertados correctamente.");
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error("Error al insertar cupones:", error);
    }
  }
}

module.exports = insertCuponesSeed;
