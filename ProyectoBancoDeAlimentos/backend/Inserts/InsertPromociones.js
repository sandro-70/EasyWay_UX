const db = require("../models");

async function insertPromocionesSeed(req, res) {
  const promociones = [
    {
      id_tipo_promo: 1,
      nombre_promocion: "Promo Bienvenida",
      descripción: "Obtén un 15% de descuento en tu primera compra.",
      valor_fijo: 0,
      valor_porcentaje: 15.0,
      compra_min: 0,
      fecha_inicio: "2025-09-01",
      activa: true,
      banner_url: "banner1.png",
      fecha_termina: "2025-09-30",
      creado_en: "2025-09-01",
    },
    {
      id_tipo_promo: 2,
      nombre_promocion: "Envío Gratis",
      descripción: "Envío gratis en compras mayores a L.500.",
      valor_fijo: 0,
      valor_porcentaje: 0.0,
      compra_min: 500,
      fecha_inicio: "2025-09-01",
      activa: true,
      banner_url: "banner2.png",
      fecha_termina: "2025-09-30",
      creado_en: "2025-09-01",
    },
    {
      id_tipo_promo: 3,
      nombre_promocion: "Descuento Fijo",
      descripción: "L.100 de descuento en compras mayores a L.1000.",
      valor_fijo: 100,
      valor_porcentaje: 0.0,
      compra_min: 1000,
      fecha_inicio: "2025-09-01",
      activa: true,
      banner_url: "banner2.png",
      fecha_termina: "2025-09-30",
      creado_en: "2025-09-01",
    },
    {
      id_tipo_promo: 1,
      nombre_promocion: "Promo Fin de Semana",
      descripción: "20% de descuento en compras realizadas sábado y domingo.",
      valor_fijo: 0,
      valor_porcentaje: 20.0,
      compra_min: 0,
      fecha_inicio: "2025-09-06",
      activa: true,
      banner_url: "banner3.png",
      fecha_termina: "2025-09-07",
      creado_en: "2025-09-06",
    },
  ];

  try {
    for (const promo of promociones) {
      const exists = await db.promocion.findOne({
        where: { nombre_promocion: promo.nombre_promocion },
      });
      if (!exists) {
        await db.promocion.create(promo);
      }
    }
    if (res) {
      res
        .status(200)
        .json({ message: "Promociones insertadas correctamente." });
    } else {
      console.log("Promociones insertadas correctamente.");
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error("Error al insertar promociones:", error);
    }
  }
}

module.exports = insertPromocionesSeed;
