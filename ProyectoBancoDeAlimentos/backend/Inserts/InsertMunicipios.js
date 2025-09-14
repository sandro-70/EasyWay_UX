const db = require("../models");

async function insertMunicipiosSeed(req, res) {
  const municipios = [
    { id_departamento: 1, nombre_municipio: "La Ceiba" },
    { id_departamento: 2, nombre_municipio: "San Pedro Sula" },
    { id_departamento: 3, nombre_municipio: "Tegucigalpa" },
    { id_departamento: 4, nombre_municipio: "Yoro" },
    { id_departamento: 5, nombre_municipio: "Trujillo" },
  ];

  try {
    for (const municipio of municipios) {
      const exists = await db.municipio.findOne({
        where: { nombre_municipio: municipio.nombre_municipio },
      });
      if (!exists) {
        await db.municipio.create(municipio);
      }
    }
    if (res) {
      res.status(200).json({ message: "Municipios insertados correctamente." });
    } else {
      console.log("Municipios insertados correctamente.");
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error("Error al insertar municipios:", error);
    }
  }
}

module.exports = insertMunicipiosSeed;
