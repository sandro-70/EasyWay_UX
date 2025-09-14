const db = require("../models");

// Insertar marcas
async function insertMarcas(req, res) {
  const marcas = [
    { nombre: "La Costeña" },
    { nombre: "Dove" },
    { nombre: "Coca Cola" },
    { nombre: "Herbal Essences" },
    { nombre: "Mazola" },
    { nombre: "Palmolive" },
    { nombre: "Colgate" },
    { nombre: "Nestlé" },
    { nombre: "Bimbo" },
    { nombre: "Sukarne" },
  ];

  try {
    let inserted = [];
    for (const marca of marcas) {
      const exists = await db.marca_producto.findOne({
        where: { nombre: marca.nombre },
      });
      if (!exists) {
        const created = await db.marca_producto.create(marca);
        inserted.push(created);
      }
    }
    res
      .status(201)
      .json({ message: "Marcas insertadas correctamente", result: inserted });
  } catch (error) {
    console.error("Error al insertar marcas:", error);
    res.status(500).json({ message: "Error al insertar marcas", error });
  }
}

module.exports = insertMarcas;
