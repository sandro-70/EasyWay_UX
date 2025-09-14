const db = require("../models");

// Insertar subcategorías
async function insertSubcategorias(req, res) {
  const subcategorias = [
    {
      nombre: "Aceites",
      id_categoria_padre: 1, // Alimentos
      url_icono_subcategoria: "oil.png",
      porcentaje_ganancias: 5.0,
    },
    {
      nombre: "Frutas",
      id_categoria_padre: 1, // Alimentos
      url_icono_subcategoria: "apple.png",
      porcentaje_ganancias: 7.5,
    },
    {
      nombre: "Granos",
      id_categoria_padre: 1, // Alimentos
      url_icono_subcategoria: "rice.png",
      porcentaje_ganancias: 8.0,
    },
    {
      nombre: "Lácteos",
      id_categoria_padre: 3, // Alimentos
      url_icono_subcategoria: "milk.png",
      porcentaje_ganancias: 6.0,
    },
    {
      nombre: "Pescados",
      id_categoria_padre: 1, // Alimentos
      url_icono_subcategoria: "fish.png",
      porcentaje_ganancias: 10.0,
    },
    {
      nombre: "Bebidas",
      id_categoria_padre: 3, // Bebidas
      url_icono_subcategoria: "soda.png",
      porcentaje_ganancias: 7.5,
    },
  ];

  try {
    let inserted = [];
    for (const subcat of subcategorias) {
      const exists = await db.subcategoria.findOne({
        where: {
          nombre: subcat.nombre,
          id_categoria_padre: subcat.id_categoria_padre,
        },
      });
      if (!exists) {
        const created = await db.subcategoria.create(subcat);
        inserted.push(created);
      }
    }
    res.status(201).json({
      message: "Subcategorías insertadas correctamente",
      result: inserted,
    });
  } catch (error) {
    console.error("Error al insertar subcategorías:", error);
    res.status(500).json({ message: "Error al insertar subcategorías", error });
  }
}

module.exports = insertSubcategorias;
