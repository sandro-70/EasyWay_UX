const { subcategoria, producto, categoria, sucursal_producto } = require("../models");
const { Op } = require("sequelize");

// controllers/subcategoriaController.js

exports.listarPorCategoria = async (req, res) => {
  try {
    const { id_categoria_padre } = req.params; // Changed from req.params.id_categoria_padre
    if (!id_categoria_padre) {
      return res.status(400).json({ message: "id_categoria_padre es requerido" });
    }

    const where = { id_categoria_padre: Number(id_categoria_padre) || id_categoria_padre };

    const subcategorias = await subcategoria.findAll({
      where,
      attributes: ["id_subcategoria", "nombre", "id_categoria_padre"],
      include: [
        { 
          model: categoria, 
          as: "categoria", 
          attributes: ["nombre"] 
        }
      ]
    });

    return res.json(subcategorias);
  } catch (e) {
    console.error("listarPorCategoria error:", e);
    return res.status(500).json({ message: e.message || String(e) });
  }
};

exports.listar = async (req, res) => {
  try {
    const data = await subcategoria.findAll({
      attributes: ['id_subcategoria', 'nombre', 'id_categoria_padre'],
      include: [
        { 
          model: categoria, 
          as: 'categoria', 
          attributes: ['nombre'] 
        }
      ]
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const item = await subcategoria.findByPk(req.params.id, {
      attributes: ['id_subcategoria', 'nombre', 'id_categoria_padre'],
      include: [
        { 
          model: categoria, 
          as: 'categoria', 
          attributes: ['nombre'] 
        }
      ]
    });
    if (!item) return res.status(404).json({ msg: 'Subcategoría no encontrada' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const {
      nombre,
      id_categoria_padre,
      url_icono_subcategoria = null,
      porcentaje_ganancias = null,
    } = req.body;

    if (!nombre || !id_categoria_padre) {
      return res.status(400).json({ msg: 'nombre y id_categoria_padre requeridos' });
    }

    // 1) Validar FK: que exista la categoría padre
    const parent = await categoria.findByPk(id_categoria_padre);
    if (!parent) {
      return res.status(400).json({ msg: 'La categoría padre no existe' });
    }

    // 2) Evitar duplicados lógicos (opcional pero recomendado)
    const yaExiste = await subcategoria.findOne({ where: { nombre, id_categoria_padre } });
    if (yaExiste) {
      return res.status(409).json({ msg: 'La subcategoría ya existe en esa categoría' });
    }

    // 3) Crear
    const created = await subcategoria.create({
      nombre,
      id_categoria_padre,
      url_icono_subcategoria,
      porcentaje_ganancias
    });

    return res.status(201).json(created);
  } catch (e) {
    // Mensajes más explícitos según el tipo de error
    if (e.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ msg: 'id_categoria_padre inválido (FK)' });
    }
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ msg: 'Registro duplicado (único)' });
    }
    return res.status(500).json({ msg: 'Error al crear subcategoría', detail: e.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { nombre, id_categoria_padre } = req.body;
    const [rows] = await subcategoria.update(
      { nombre, id_categoria_padre },
      { where: { id_subcategoria: req.params.id } }
    );
    if (!rows) return res.status(404).json({ msg: 'Subcategoría no encontrada' });
    res.json({ msg: 'Subcategoría actualizada' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.desactivarProductos = async (req, res) => {
  try {
    await producto.update({ activo: false }, { where: { id_subcategoria: req.params.id } });
    res.json({ msg: 'Productos de esta subcategoría desactivados' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.compararProductos = async (req, res) => {
    try {
        const body = req.body || {};
        const { productIds } = body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ 
                message: 'Se requiere un arreglo de productIds en el body. Ejemplo: { "productIds": [1,2,3] }' 
            });
        }

        const productos = await producto.findAll({
            where: { id_producto: { [Op.in]: productIds } },
            attributes: ['id_producto', 'nombre', 'descripcion', 'precio_base', 'unidad_medida', 'id_marca'],
            include: [
                {
                    model: sucursal_producto,
                    attributes: ['stock_disponible']
                }
            ]
        });

        if (productos.length !== productIds.length) {
            return res.status(404).json({ message: 'Algunos de los productos no fueron encontrados.' });
        }

        const comparacion = {};

        productos.forEach(p => {
            const stockTotal = p.sucursal_productos.reduce((acc, sp) => acc + sp.stock_disponible, 0);
            comparacion[p.id_producto] = {
                id_producto: p.id_producto,
                nombre: p.nombre,
                descripcion: p.descripcion,
                precio_base: p.precio_base,
                stock_total: stockTotal,
                unidad_medida: p.unidad_medida,
                marca: p.id_marca
            };
        });

        return res.status(200).json(comparacion);

    } catch (error) {
        console.error('Error en compararProductos:', error);
        return res.status(500).json({ message: 'Error interno al comparar los productos.' });
    }
};