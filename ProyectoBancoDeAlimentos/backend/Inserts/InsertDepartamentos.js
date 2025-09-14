const db = require("../models");

async function insertDepartamentosSeed(req, res) {
  const departamentos = [
    { nombre_departamento: "Atlántida" },
    { nombre_departamento: "Cortés" },
    { nombre_departamento: "Francisco Morazán" },
    { nombre_departamento: "Yoro" },
    { nombre_departamento: "Colón" },
  ];

  try {
    for (const departamento of departamentos) {
      const exists = await db.departamento.findOne({
        where: { nombre_departamento: departamento.nombre_departamento },
      });
      if (!exists) {
        await db.departamento.create(departamento);
      }
    }
    if (res) {
      res
        .status(200)
        .json({ message: "Departamentos insertados correctamente." });
    } else {
      console.log("Departamentos insertados correctamente.");
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error("Error al insertar departamentos:", error);
    }
  }
}

module.exports = insertDepartamentosSeed;
