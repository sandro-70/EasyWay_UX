const db = require("../models");

async function insertSucursalesSeed(req, res) {
  const sucursales = [
    { id_municipio: 1, nombre_sucursal: "Sucursal Central", activo: true },
    { id_municipio: 2, nombre_sucursal: "Sucursal Norte", activo: true },
    { id_municipio: 3, nombre_sucursal: "Sucursal Sur", activo: true },
    { id_municipio: 4, nombre_sucursal: "Sucursal Este", activo: true },
    { id_municipio: 5, nombre_sucursal: "Sucursal Oeste", activo: true },
  ];

  try {
    for (const sucursal of sucursales) {
      const exists = await db.sucursal.findOne({
        where: { nombre_sucursal: sucursal.nombre_sucursal },
      });
      if (!exists) {
        await db.sucursal.create(sucursal);
      }
    }
    if (res) {
      res.status(200).json({ message: "Sucursales insertadas correctamente." });
    } else {
      console.log("Sucursales insertadas correctamente.");
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error("Error al insertar sucursales:", error);
    }
  }
}

module.exports = insertSucursalesSeed;
