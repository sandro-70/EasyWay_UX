const { producto, Usuario, lista_deseos,imagen_producto, sequelize } = require('../models');


exports.agregarAListaDeseos = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { id_producto } = req.body;

    const product = await producto.findOne({ where: { id_producto } });
    if (!product) {
      return res.status(404).json({ message: "El producto no fue encontrado!" });
    }

    const user = await Usuario.findOne({ where: { id_usuario } });
    if (!user) {
      return res.status(404).json({ message: "No se pudo encontrar el usuario!" });
    }

    // Validar si ya existe en la lista
    const existente = await lista_deseos.findOne({
      where: { id_usuario, id_producto }
    });

    if (existente) {
      return res.status(400).json({ message: "El producto ya está en la lista de deseos!" });
    }
    
    const nuevo = await lista_deseos.create({ id_usuario, id_producto });

    return res.status(201).json({
      message: "Producto agregado a la lista de deseos!",
      data: nuevo
    });
  } catch (error) {
    console.error("Error al agregar a lista de deseos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.getListaDeseos = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const user = await Usuario.findOne({ where: { id_usuario } });

    if (!user) {
      return res.status(404).json({ message: "No se encontró el usuario!" });
    }

    const listaDeDeseos = await lista_deseos.findAll({
      where: { id_usuario },
      include: [{
        model: producto,
        attributes: ['id_producto', 'nombre', 'descripcion', 'precio_base', 'unidad_medida', 'peso', 'id_marca', 'porcentaje_ganancia', 'estrellas','activo','etiquetas'],
        include: [{
          model: imagen_producto,
          as: 'imagenes',
          attributes: ['id_imagen', 'url_imagen', 'orden_imagen']
        }]
      }]
    });

    return res.json(listaDeDeseos);
  } catch (error) {
    console.error("Error al obtener lista de deseos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.eliminarDeListaDeseos = async (req, res) => {
  try {
    const { id_usuario, id_producto } = req.params;
    const eliminado = await lista_deseos.destroy({
      where: { id_usuario, id_producto }
    });
    if (eliminado) {
      return res.json({ message: "Producto eliminado de la lista de deseos!" });
    } else {
      return res.status(404).json({ message: "El producto no se encontró en la lista de deseos!" });
    }
  } catch (error) {
    console.error("Error al eliminar de lista de deseos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.vaciarListaDeseos = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const eliminado = await lista_deseos.destroy({
      where: { id_usuario }
    });
    if (eliminado) {
      return res.json({ message: "Lista de deseos vaciada!" });
    }
    else {
      return res.status(404).json({ message: "No se encontraron productos en la lista de deseos!" });
    }
  } catch (error) {
    console.error("Error al vaciar lista de deseos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
