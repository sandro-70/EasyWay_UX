const db = require("../models");

// Insertar categorías
async function insertCategorias(req, res) {
  const categorias = [
    {
      nombre: "Alimentos",
      icono_categoria: "bread.png",
      PorcentajeDeGananciaMinimo: 5.0,
    },
    {
      nombre: "cafe",
      icono_categoria: "coffee.png",
      PorcentajeDeGananciaMinimo: 7.5,
    },
    {
      nombre: "Bebidas",
      icono_categoria: "soda.png",
      PorcentajeDeGananciaMinimo: 4.0,
    },
    {
      nombre: "Panaderia",
      icono_categoria: "bread.png",
      PorcentajeDeGananciaMinimo: 6.0,
    },
  ];

  try {
    let inserted = [];
    for (const cat of categorias) {
      const exists = await db.categoria.findOne({
        where: { nombre: cat.nombre },
      });
      if (!exists) {
        const created = await db.categoria.create(cat);
        inserted.push(created);
      }
    }
    res.status(201).json({
      message: "Categorías insertadas correctamente",
      result: inserted,
    });
  } catch (error) {
    console.error("Error al insertar categorías:", error);
    res.status(500).json({ message: "Error al insertar categorías", error });
  }
}

module.exports = insertCategorias;
