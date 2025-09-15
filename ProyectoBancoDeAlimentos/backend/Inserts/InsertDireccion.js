const db = require("../models");

async function seed(req, res) {
  const sample = [
    {
      id_usuario: 1,
      calle: "Colonia Centro 123",
      ciudad: "Tegucigalpa",
      codigo_postal: "11101",
      predeterminada: true,
      id_municipio: 1,
    },
    {
      id_usuario: 2,
      calle: "Barrio Sur 45",
      ciudad: "San Pedro",
      codigo_postal: "22002",
      predeterminada: false,
      id_municipio: 2,
    },
    {
      id_usuario: 3,
      calle: "Residencial Las Flores 9",
      ciudad: "La Ceiba",
      codigo_postal: "33003",
      predeterminada: false,
      id_municipio: 3,
    },
  ];

  try {
    for (const rec of sample) {
      const [row, created] = await db.direccion.findOrCreate({
        where: { id_usuario: rec.id_usuario, calle: rec.calle },
        defaults: rec,
      });
    }
    res.status(201).json({ message: "Direcciones insertadas" });
  } catch (e) {
    console.error("Seed error:", e);
    res.status(500).json({ message: "Error al insertar direcciones" });
  }
}
module.exports = seed;
