const db = require("../models");

// Insertar imágenes de productos
async function insertImagesProducto(req, res) {
  const images = [
    {
      id_producto: 1,
      url_imagen: "aceiteVegetal.png",
      orden_imagen: 1,
    },
    {
      id_producto: 2,
      url_imagen: "appleImage.png",
      orden_imagen: 1,
    },
    {
      id_producto: 3,
      url_imagen: "arrozBlanco.png",
      orden_imagen: 1,
    },
    {
      id_producto: 4,
      url_imagen: "atunAgua.png",
      orden_imagen: 1,
    },
    {
      id_producto: 5,
      url_imagen: "frijolRojo.png",
      orden_imagen: 1,
    },
    {
      id_producto: 6,
      url_imagen: "lecheDeslactosada.png",
      orden_imagen: 1,
    },
    {
      id_producto: 7,
      url_imagen: "lecheEntera.png",
      orden_imagen: 1,
    },
    {
      id_producto: 8,
      url_imagen: "yogurtFresa.png",
      orden_imagen: 1,
    },
    {
      id_producto: 9,
      url_imagen: "cocacola.png",
      orden_imagen: 1,
    },
  ];

  try {
    let inserted = [];
    for (const img of images) {
      const exists = await db.imagen_producto.findOne({
        where: { url_imagen: img.url_imagen },
      });
      if (!exists) {
        const created = await db.imagen_producto.create(img);
        inserted.push(created);
      }
    }
    res
      .status(201)
      .json({ message: "Imágenes insertadas correctamente", result: inserted });
  } catch (error) {
    console.error("Error al insertar imágenes de productos:", error);
    res
      .status(500)
      .json({ message: "Error al insertar imágenes de productos", error });
  }
}

module.exports = insertImagesProducto;
