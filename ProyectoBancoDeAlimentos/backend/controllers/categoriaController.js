const { categoria, producto } = require('../models');

exports.listar = async (req, res) => {
  try {
    const data = await categoria.findAll({ attributes: ['id_categoria', 'nombre', 'icono_categoria'] });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const item = await categoria.findByPk(req.params.id, { attributes: ['id_categoria', 'nombre', 'icono_categoria'] });
    if (!item) return res.status(404).json({ msg: 'Categoría no encontrada' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.crear = async (req, res) => {
   try {
    const { nombre, icono_categoria } = req.body; // 👈 leer el nombre correcto
    if (!nombre || !icono_categoria) {
      return res.status(400).json({ msg: 'nombre e icono_categoria son obligatorios' });
    }

    const created = await categoria.create({ nombre, icono_categoria }); // 👈 guardar con el nombre correcto
    res.status(201).json(created);
  } catch (e) {
    // Log útil para depurar
    console.error('Error creando categoría:', e);
    res.status(500).json({ error: e.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { nombre, icono_categoria } = req.body;
    const [rows] = await categoria.update(
      { nombre, icono_categoria },
      { where: { id_categoria: req.params.id } }
    );
    if (!rows) return res.status(404).json({ msg: 'Categoría no encontrada' });
    res.json({ msg: 'Categoría actualizada' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.desactivarProductos = async (req, res) => {
  try {
    await producto.update({ activo: false }, { where: { id_subcategoria: req.params.id } });
    res.json({ msg: 'Productos de esta categoría desactivados' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};