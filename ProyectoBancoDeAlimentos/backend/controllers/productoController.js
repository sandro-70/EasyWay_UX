const {
  producto,
  imagen_producto,
  categoria,
  subcategoria,
  marca_producto,
  sucursal_producto,
  Sequelize,
} = require("../models");
const { Op } = Sequelize;
const fs = require("fs");
const path = require("path");
// Productos destacados (últimos creados) con 1 imagen

exports.destacados = async (req, res) => {
  try {
    const products = await producto.findAll({
      where: { activo: true },
      attributes: [
        "id_producto",
        "nombre",
        "descripcion",
        "precio_base",
        "unidad_medida",
        "estrellas",
        "etiquetas",
      ],
      include: [
        {
          model: imagen_producto,
          as: "imagenes",
          attributes: ["url_imagen"],
          limit: 1,
          separate: true,
          order: [["orden_imagen", "ASC"]],
        },
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre", "id_categoria_padre"],
          include: [
            {
              model: categoria,
              as: "categoria",
              attributes: ["id_categoria", "nombre"],
            },
          ],
        },
        {
          model: marca_producto,
          as: "marca",
          attributes: ["id_marca_producto", "nombre"],
        },
      ],
      order: [["id_producto", "DESC"]],
      limit: 10,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tendencias (mayor precio) con 1 imagen
exports.tendencias = async (req, res) => {
  try {
    const products = await producto.findAll({
      where: { activo: true },
      attributes: [
        "id_producto",
        "nombre",
        "descripcion",
        "precio_base",
        "unidad_medida",
        "estrellas",
        "etiquetas",
      ],
      include: [
        {
          model: imagen_producto,
          as: "imagenes",
          attributes: ["url_imagen"],
          limit: 1,
          separate: true,
          order: [["orden_imagen", "ASC"]],
        },
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre", "id_categoria_padre"],
          include: [
            {
              model: categoria,
              as: "categoria",
              attributes: ["id_categoria", "nombre"],
            },
          ],
        },
        {
          model: marca_producto,
          as: "marca",
          attributes: ["id_marca_producto", "nombre"],
        },
      ],
      order: [["precio_base", "DESC"]],
      limit: 10,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listarProductos = async (req, res) => {
  try {
    const products = await producto.findAll({
      where: { activo: { [Op.ne]: null } },
      attributes: [
        "id_producto",
        "nombre",
        "descripcion",
        "precio_base",
        "unidad_medida",
        "estrellas",
        "etiquetas",
        "activo",
        "peso",
        [
          Sequelize.literal(
            "(SELECT SUM(stock_disponible) FROM sucursal_producto WHERE sucursal_producto.id_producto = producto.id_producto)"
          ),
          "stock_total",
        ],
      ],
      include: [
        {
          model: imagen_producto,
          as: "imagenes",
          attributes: ["url_imagen", "orden_imagen"],
        },
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre", "id_categoria_padre"],
          include: [
            {
              model: categoria,
              as: "categoria",
              attributes: [
                "id_categoria",
                "nombre",
                "icono_categoria",
                "PorcentajeDeGananciaMinimo",
              ],
            },
          ],
        },
        {
          model: marca_producto,
          as: "marca",
          attributes: ["id_marca_producto", "nombre"],
        },
      ],
      order: [["id_producto", "DESC"]],
    });

    // Calcular porcentaje_ganancia y precio_venta usando la categoría asociada
    const productsWithCalculations = products.map((product) => {
      const productJSON = product.toJSON();
      const porcentaje_ganancia =
        productJSON.subcategoria?.categoria?.PorcentajeDeGananciaMinimo ?? 0;
      const precio_venta =
        parseFloat(productJSON.precio_base) * (1 + porcentaje_ganancia / 100);
      return {
        ...productJSON,
        porcentaje_ganancia,
        stock_total: productJSON.stock_total || 0,
        precio_venta: precio_venta.toFixed(2),
        categoria: productJSON.subcategoria?.categoria || null,
      };
    });

    return res.status(200).json(productsWithCalculations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listarProductosporsucursal = async (req, res) => {
  try {
    const { id_sucursal } = req.params;
    const products = await producto.findAll({
      where: { activo: { [Op.ne]: null } },
      attributes: [
        "id_producto",
        "nombre",
        "descripcion",
        "precio_base",
        "unidad_medida",
        "estrellas",
        "etiquetas",
        "activo",
        "peso",
        [
          Sequelize.literal(
            `(SELECT stock_disponible FROM sucursal_producto WHERE sucursal_producto.id_producto = producto.id_producto AND sucursal_producto.id_sucursal = ${id_sucursal})`
          ),
          "stock_en_sucursal",
        ],
      ],
      include: [
        {
          model: imagen_producto,
          as: "imagenes",
          attributes: ["url_imagen", "orden_imagen"],
        },
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre", "id_categoria_padre"],
          include: [
            {
              model: categoria,
              as: "categoria",
              attributes: [
                "id_categoria",
                "nombre",
                "icono_categoria",
                "PorcentajeDeGananciaMinimo",
              ],
            },
          ],
        },
        {
          model: marca_producto,
          as: "marca",
          attributes: ["id_marca_producto", "nombre"],
        },
      ],
      order: [["id_producto", "DESC"]],
    });
    // Calcular porcentaje_ganancia y precio_venta usando la categoría asociada
    const productsWithCalculations = products.map((product) => {
      const productJSON = product.toJSON();
      const porcentaje_ganancia =
        productJSON.subcategoria?.categoria?.PorcentajeDeGananciaMinimo ?? 0;
      const precio_venta =
        parseFloat(productJSON.precio_base) * (1 + porcentaje_ganancia / 100);
      return {
        ...productJSON,
        porcentaje_ganancia,
        stock_en_sucursal: productJSON.stock_en_sucursal || 0,
        precio_venta: precio_venta.toFixed(2),
        categoria: productJSON.subcategoria?.categoria || null,
      };
    });
    return res.status(200).json(productsWithCalculations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listarMarcas = async (req, res) => {
  try {
    const marcas = await marca_producto.findAll({
      attributes: ["id_marca_producto", "nombre"],
    });
    res.json(marcas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener por id (todas las imágenes)
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await producto.findOne({
      where: { id_producto: id, activo: { [Op.ne]: null } },
      attributes: [
        "id_producto",
        "nombre",
        "descripcion",
        "precio_base",
        "unidad_medida",
        "estrellas",
        "etiquetas",
        "porcentaje_ganancia",
        "peso",
        [
          Sequelize.literal("precio_base * (1 + porcentaje_ganancia / 100)"),
          "precio_venta",
        ],
      ],
      include: [
        {
          model: imagen_producto,
          as: "imagenes",
          attributes: ["url_imagen", "orden_imagen"],
        },
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre", "id_categoria_padre"],
          include: [
            {
              model: categoria,
              as: "categoria",
              attributes: ["id_categoria", "nombre"],
            },
          ],
        },
        {
          model: marca_producto,
          as: "marca",
          attributes: ["id_marca_producto", "nombre"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const {
  crearProductoConStockEnSucursales,
} = require("../services/serviceInventario");

// Crear producto con imágenes
exports.addproducto = async (req, res) => {
  try {
    const { imagenes_payload, ...body } = req.body;
    const payload = {
      ...body,
      files: req.files, // archivos subidos por multer
      imagenes_payload,
    };
    const data = await crearProductoConStockEnSucursales(payload);
    return res.status(201).json(data);
  } catch (e) {
    console.error("❌ Crear producto error:", e);

    if (
      e.name === "SequelizeValidationError" ||
      e.name === "SequelizeUniqueConstraintError"
    ) {
      return res.status(400).json({
        name: e.name,
        errors: (e.errors || []).map((err) => ({
          message: err.message,
          path: err.path,
          value: err.value,
          validatorKey: err.validatorKey,
        })),
      });
    }

    if (e.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        name: e.name,
        index: e.index,
        fields: e.fields,
        table: e.table,
        message: e.parent?.detail || e.message,
      });
    }

    return res.status(400).json({ message: String(e?.message || e) });
  }
};

// POST /api/productos/imagenes
exports.subirImagenesProducto = async (req, res) => {
  try {
    const { id_producto } = req.body;
    const files = req.files; // Archivos subidos con multer

    // Validar que se proporcionó id_producto
    if (!id_producto) {
      return res.status(400).json({ msg: "id_producto es requerido" });
    }

    // Validar que hay archivos
    if (!files || files.length === 0) {
      return res.status(400).json({ msg: "Archivos de imagen son requeridos" });
    }

    // Verificar que el producto existe
    const prod = await producto.findByPk(id_producto);
    if (!prod) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    // Procesar cada archivo subido
    const imagenesData = files.map((file, index) => ({
      id_producto: parseInt(id_producto),
      url_imagen: `/images/productos/${file.filename}`, // URL relativa al archivo subido
      orden_imagen: index, // Orden basado en el índice del array
    }));

    // Guardar en la base de datos
    const createdImages = await imagen_producto.bulkCreate(imagenesData);

    res.status(201).json({
      msg: "Imágenes subidas y guardadas",
      imagenes: createdImages,
      archivos: files.map((f) => f.filename),
    });
  } catch (err) {
    console.error("Error en subirImagenesProducto:", err);
    res.status(500).json({ error: err.message });
  }
};
// DELETE /api/productos/imagenes/:imagenId
exports.eliminarImagenProducto = async (req, res) => {
  try {
    const { imagenId } = req.params;
    const img = await imagen_producto.findByPk(imagenId);
    if (!img) {
      return res.status(404).json({ msg: "Imagen no encontrada" });
    }

    // Delete the file from filesystem
    const filename = path.basename(img.url_imagen);
    const filePath = path.join(
      __dirname,
      "..",
      "public",
      "images",
      "productos",
      filename
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await img.destroy();
    res.json({ msg: "Imagen eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Solo imágenes de un producto
exports.imagenesProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener imágenes desde la base de datos
    const dbImages = await imagen_producto.findAll({
      where: { id_producto: id },
      attributes: ["id_imagen", "url_imagen", "orden_imagen"],
      order: [["orden_imagen", "ASC"]],
    });

    // Leer imágenes desde la carpeta del producto
    const productDir = path.join(
      __dirname,
      "..",
      "public",
      "images",
      "productos"
    );
    const files = fs.readdirSync(productDir);

    // Filtrar imágenes que estén en la BD y existan en el filesystem
    const images = dbImages
      .filter((dbImg) => {
        const filename = path.basename(dbImg.url_imagen);
        return (
          files.includes(filename) &&
          fs.existsSync(path.join(productDir, filename))
        );
      })
      .map((dbImg, index) => ({
        id_imagen: dbImg.id_imagen,
        url_imagen: dbImg.url_imagen,
        orden_imagen: dbImg.orden_imagen,
      }));

    res.json(images);
  } catch (err) {
    console.error("Error leyendo imágenes del producto:", err);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/productos/:id/porcentaje-ganancia
exports.putPorcentajeGanancia = async (req, res) => {
  try {
    const { porcentaje_ganancia } = req.body;
    if (porcentaje_ganancia === undefined || porcentaje_ganancia < 0)
      return res.status(400).json({ msg: "porcentaje_ganancia debe ser >= 0" });

    const [rows] = await producto.update(
      { porcentaje_ganancia },
      { where: { id_producto: req.params.id } }
    );
    if (!rows) return res.status(404).json({ msg: "Producto no encontrado" });
    res.json({ msg: "Margen actualizado", porcentaje_ganancia });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/productos/porcentaje-ganancia
exports.getAllPorcentajeGanancia = async (_req, res) => {
  try {
    const cats = await categoria.findAll({
      attributes: ["id_categoria", "nombre", "PorcentajeDeGananciaMinimo"],
    });
    return res.json(cats);
  } catch (err) {
    console.error("GetAllPorcentajeDeGananciasEnCategoria error:", err);
    return res
      .status(500)
      .json({ error: "No se pudieron obtener los porcentajes." });
  }
};

exports.productosRecomendados = async (req, res) => {
  try {
    const products = await producto.findAll({
      where: { activo: true },
      attributes: [
        "id_producto",
        "nombre",
        "descripcion",
        "precio_base",
        "unidad_medida",
        "estrellas",
        "etiquetas",
        "id_subcategoria",
        "id_marca",
      ],
      include: [
        {
          model: imagen_producto,
          as: "imagenes",
          attributes: ["url_imagen"],
          limit: 1,
          separate: true,
          order: [["orden_imagen", "ASC"]],
        },
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre", "id_categoria_padre"],
          include: [
            {
              model: categoria,
              as: "categoria",
              attributes: ["id_categoria", "nombre"],
            },
          ],
        },
        {
          model: marca_producto,
          as: "marca",
          attributes: ["id_marca_producto", "nombre"],
        },
      ],
      order: [
        ["estrellas", "DESC"],
        ["id_producto", "DESC"],
      ],
    });

    // Calcular porcentaje_ganancia y precio_venta usando la categoría asociada
    const productsWithCalculations = products.map((product) => {
      const productJSON = product.toJSON();
      const porcentaje_ganancia =
        productJSON.subcategoria?.categoria?.PorcentajeDeGananciaMinimo ?? 0;
      const precio_venta =
        parseFloat(productJSON.precio_base) * (1 + porcentaje_ganancia / 100);
      return {
        ...productJSON,
        porcentaje_ganancia,
        precio_venta: precio_venta.toFixed(2),
        precio_base:precio_venta.toFixed(2),
        categoria: productJSON.subcategoria?.categoria || null,
      };
    });

    res.json(productsWithCalculations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// PATCH /api/producto/desactivar/:id_producto

exports.desactivarProducto = async (req, res) => {
  try {
    const { id_producto } = req.params; // <-- Corrige req.params para obtener el ID del producto

    const product = await producto.findByPk(id_producto);

    if (!product) {
      return res
        .status(404)
        .json({ message: "No se pudo encontrar el producto!" });
    }

    if (!product.activo) {
      return res.status(400).json({ message: "El producto ya está inactivo" });
    }

    product.activo = false;

    await product.save();
    return res
      .status(200)
      .json({ message: "Producto desactivado correctamente!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al borrar producto!" });
  }
};

exports.crearMarca = async (req, res) => {
  try {
    const { nombre_marca } = req.body;

    if (
      !nombre_marca ||
      typeof nombre_marca !== "string" ||
      nombre_marca.trim() === ""
    ) {
      return res.status(400).json({
        message: "El nombre de la marca es requerido y debe ser válido",
      });
    }

    // Verificar si la marca ya existe
    const existingMarca = await marca_producto.findOne({
      where: { nombre: nombre_marca },
    });
    if (existingMarca) {
      return res.status(409).json({ message: "La marca ya existe" });
    }

    // Crear la marca
    const newMarca = await marca_producto.create({ nombre: nombre_marca });
    res.json({
      message: "Marca creada correctamente",
      marca: newMarca.toJSON(),
    });
  } catch (error) {
    console.error("Error al crear marca:", error);
    res.status(500).json({ error: "Error al crear marca" });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    const id = req.params.id_producto;
    const {
      nombre,
      descripcion,
      precio_base,
      subcategoria_id,
      porcentaje_ganancia,
      marca_id,
      etiquetas,
      unidad_medida,
      activo,
      peso_kg,
      imagenes_payload,
    } = req.body;

    const files = req.files; // Archivos subidos con multer

    // Validar que el ID del producto sea numérico
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "ID de producto inválido" });
    }

    // Buscar el producto
    const product = await producto.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Validar que la subcategoría existe
    const subcat = await subcategoria.findByPk(subcategoria_id);
    if (!subcat) {
      return res.status(400).json({ message: "La subcategoría no existe" });
    }

    // Validar que la marca existe
    const marca = await marca_producto.findByPk(marca_id);
    if (!marca) {
      return res.status(400).json({ message: "La marca no existe" });
    }

    // Validar datos requeridos
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    if (!precio_base || precio_base <= 0) {
      return res.status(400).json({ message: "Precio base inválido" });
    }

    // Preparar etiquetas (asegurar que sea un array)
    let etiquetasArray = [];
    if (etiquetas) {
      if (Array.isArray(etiquetas)) {
        etiquetasArray = etiquetas;
      } else if (typeof etiquetas === "string") {
        etiquetasArray = etiquetas
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      }
    }

    if (["unidad", "libra", "litro"].indexOf(unidad_medida) === -1) {
      return res.status(400).json({ message: "Unidad de medida inválida" });
    }

    // Actualizar el producto
    await product.update({
      nombre: nombre.trim(),
      descripcion: descripcion || "",
      precio_base: parseFloat(precio_base),
      id_subcategoria: parseInt(subcategoria_id),
      porcentaje_ganancia: porcentaje_ganancia
        ? parseFloat(porcentaje_ganancia)
        : null,
      id_marca: parseInt(marca_id),
      etiquetas: etiquetasArray,
      unidad_medida,
      activo: activo !== undefined ? Boolean(activo) : true,
      peso: peso_kg !== undefined ? parseFloat(peso_kg) : null,
    });

    // Actualizar imagenes
    const payload = JSON.parse(imagenes_payload || "[]");

    // Validar que el producto tenga al menos una imagen
    if (payload.length === 0) {
      return res.status(400).json({ message: "El producto debe tener al menos una imagen" });
    }

    await imagen_producto.destroy({ where: { id_producto: id } });
    let fileIndex = 0;
    for (const item of payload) {
      const { url_imagen, orden_imagen, is_file } = item;
      let url;
      if (is_file) {
        if (!files || !files[fileIndex]) {
          return res.status(400).json({ message: "Archivo requerido para imagen nueva" });
        }
        url = `/images/productos/${files[fileIndex].filename}`;
        fileIndex++;
      } else {
        url = url_imagen;
      }
      await imagen_producto.create({
        id_producto: id,
        url_imagen: url,
        orden_imagen,
      });
    }

    // Obtener el producto actualizado con detalles
    const updatedProduct = await producto.findByPk(id, {
      include: [
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre"],
        },
        {
          model: marca_producto,
          as: "marca",
          attributes: ["id_marca_producto", "nombre"],
        },
        {
          model: imagen_producto,
          as: "imagenes",
          attributes: ["url_imagen", "orden_imagen"],
        },
      ],
    });

    res.json({
      message: "Producto actualizado correctamente",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    // Manejar errores específicos de Sequelize
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res.status(400).json({
        message: "Error de validación",
        errors,
      });
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message:
          "Error de referencia: verifica que la subcategoría y marca existan",
      });
    }

    return res.status(500).json({
      message: "Error interno al actualizar producto",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getStock = async (req, res) => {
  try {
    const data = await sucursal_producto.findAll({
      attributes: ["id_sucursal", "id_producto", "stock_disponible"],
      include: [
        {
          model: producto,
          attributes: ["nombre", "unidad_medida"],
          include: [
            {
              model: subcategoria,
              as: "subcategoria",
              attributes: ["nombre"],
              include: [
                {
                  model: categoria,
                  as: "categoria",
                  attributes: ["nombre"],
                },
              ],
            },
          ],
        },
      ],
      order: [["stock_disponible", "ASC"]], // de menor a mayor stock
    });

    const result = data.map((item) => ({
      id_sucursal: item.id_sucursal,
      id_producto: item.id_producto,
      nombre_producto: item.producto?.nombre,
      categoria: item.producto?.subcategoria?.categoria?.nombre || null,
      subcategoria: item.producto?.subcategoria?.nombre || null,
      stock: item.stock_disponible,
      unidad_medida: item.producto?.unidad_medida,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
