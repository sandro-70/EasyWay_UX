
const { auditoria_inventario, producto, subcategoria, categoria, sequelize, sucursal_producto} = require('../models');

exports.agregarAuditoria = async (req, res) => {
    try{
        const {id_producto, id_usuario, id_sucursal, cantidad, nombre_operacion } = req.body;

        if (!id_producto || isNaN(id_producto)) {
            return res.status(400).json({ message: "id_producto inválido" });
        }

        const prod = await producto.findByPk(id_producto);
        if (!prod) {
        return res.status(404).json({ message: "Producto no encontrado" });
        }

        const registro = await auditoria_inventario.create({
        id_producto,
        id_usuario,
        id_sucursal,
        cantidad,
        nombre_operacion,
        fecha_movimiento: new Date()
        });

        return res.json({ message: "Auditoría registrada", registro });

    }catch(error){
        console.error("Error al agregar la auditoria:", error);
        return res.status(500).json({ error: "Error interno al agregar categoria" });
    }
}

exports.listarAuditorias = async (req, res) => {
  try {
    const auditorias = await auditoria_inventario.findAll({
      attributes: ["id_producto", "cantidad", ["nombre_operacion", "operacion"]],
      include: [
        {
          model: producto,
          attributes: ["nombre", "activo"],
          include: [
            {
              model: subcategoria,
              as: "subcategoria",
              attributes: ["nombre"],
              include: [
                {
                  model: categoria,
                  as: "categoria",
                  attributes: ["nombre"]
                }
              ]
            }
          ]
        }
      ]
    });

    //formatear
    const resultado = auditorias.map(a => ({
      id_producto: a.id_producto,
      nombre_producto: a.producto?.nombre,
      categoria: a.producto?.subcategoria?.categoria?.nombre,
      subcategoria: a.producto?.subcategoria?.nombre,
      cantidad: a.cantidad,
      operacion: a.get("operacion"),
      estado_producto: a.producto?.activo ? "Activo" : "Inactivo"
    }));

    return res.json(resultado);

  } catch (error) {
    console.error("Error listando auditorías:", error);
    return res.status(500).json({ message: "Error al listar las auditorías" });
  }
};

exports.filtrarCantidadMayor = async (req, res) => {
  try {
    const auditorias = await auditoria_inventario.findAll({
      attributes: ["id_producto", "cantidad", ["nombre_operacion", "operacion"]],
      include: [
        {
          model: producto,
          attributes: ["nombre", "activo"],
          include: [
            {
              model: subcategoria,
              as: "subcategoria",
              attributes: ["nombre"],
              include: [
                {
                  model: categoria,
                  as: "categoria",
                  attributes: ["nombre"]
                }
              ]
            }
          ]
        }
      ],
      order: [["cantidad", "DESC"]]//mayor a menor
    });

    const resultado = auditorias.map(a => ({
      id_producto: a.id_producto,
      nombre_producto: a.producto?.nombre,
      categoria: a.producto?.subcategoria?.categoria?.nombre,
      subcategoria: a.producto?.subcategoria?.nombre,
      cantidad: a.cantidad,
      operacion: a.get("operacion"),
      estado_producto: a.producto?.activo ? "Activo" : "Inactivo"
    }));

    return res.json(resultado);

  } catch (error) {
    console.error("Error listando auditorías:", error);
    return res.status(500).json({ message: "Error al listar las auditorías" });
  }
};

exports.filtrarCantidadMenor = async (req, res) => {
  try {
    const auditorias = await auditoria_inventario.findAll({
      attributes: ["id_producto", "cantidad", ["nombre_operacion", "operacion"]],
      include: [
        {
          model: producto,
          attributes: ["nombre", "activo"],
          include: [
            {
              model: subcategoria,
              as: "subcategoria",
              attributes: ["nombre"],
              include: [
                {
                  model: categoria,
                  as: "categoria",
                  attributes: ["nombre"]
                }
              ]
            }
          ]
        }
      ],
      order: [["cantidad", "ASC"]] //menor a mayor
    });

    const resultado = auditorias.map(a => ({
      id_producto: a.id_producto,
      nombre_producto: a.producto?.nombre,
      categoria: a.producto?.subcategoria?.categoria?.nombre,
      subcategoria: a.producto?.subcategoria?.nombre,
      cantidad: a.cantidad,
      operacion: a.get("operacion"),
      estado_producto: a.producto?.activo ? "Activo" : "Inactivo"
    }));

    return res.json(resultado);

  } catch (error) {
    console.error("Error listando auditorías:", error);
    return res.status(500).json({ message: "Error al listar las auditorías" });
  }
};

exports.filtrarEntradas = async (req, res) => {
  try {
    const auditorias = await auditoria_inventario.findAll({
      attributes: ["id_producto", "cantidad", ["nombre_operacion", "operacion"]],
      include: [
        {
          model: producto,
          attributes: ["nombre", "activo"],
          include: [
            {
              model: subcategoria,
              as: "subcategoria",
              attributes: ["nombre"],
              include: [
                {
                  model: categoria,
                  as: "categoria",
                  attributes: ["nombre"]
                }
              ]
            }
          ]
        }
      ],
      order: [
        [sequelize.literal(`CASE WHEN nombre_operacion = 'entrada' THEN 1 ELSE 2 END`), "ASC"],
        ["cantidad", "DESC"] // dentro de cada grupo, mayor a menor
      ]
    });

    const resultado = auditorias.map(a => ({
      id_producto: a.id_producto,
      nombre_producto: a.producto?.nombre,
      categoria: a.producto?.subcategoria?.categoria?.nombre,
      subcategoria: a.producto?.subcategoria?.nombre,
      cantidad: a.cantidad,
      operacion: a.get("operacion"),
      estado_producto: a.producto?.activo ? "Activo" : "Inactivo"
    }));

    return res.json(resultado);

  } catch (error) {
    console.error("Error listando auditorías:", error);
    return res.status(500).json({ message: "Error al listar las auditorías" });
  }
};

exports.filtrarSalidas = async (req, res) => {
  try {
    const auditorias = await auditoria_inventario.findAll({
      attributes: ["id_producto", "cantidad", ["nombre_operacion", "operacion"]],
      include: [
        {
          model: producto,
          attributes: ["nombre", "activo"],
          include: [
            {
              model: subcategoria,
              as: "subcategoria",
              attributes: ["nombre"],
              include: [
                {
                  model: categoria,
                  as: "categoria",
                  attributes: ["nombre"]
                }
              ]
            }
          ]
        }
      ],
      order: [
        [sequelize.literal(`CASE WHEN nombre_operacion = 'salida' THEN 1 WHEN nombre_operacion = 'entrada' THEN 2 ELSE 3 END`), "ASC"],
        ["cantidad", "DESC"] // dentro de cada grupo, ordena por cantidad
      ]
    });

    const resultado = auditorias.map(a => ({
      id_producto: a.id_producto,
      nombre_producto: a.producto?.nombre,
      categoria: a.producto?.subcategoria?.categoria?.nombre,
      subcategoria: a.producto?.subcategoria?.nombre,
      cantidad: a.cantidad,
      operacion: a.get("operacion"),
      estado_producto: a.producto?.activo ? "Activo" : "Inactivo"
    }));

    return res.json(resultado);

  } catch (error) {
    console.error("Error listando auditorías:", error);
    return res.status(500).json({ message: "Error al listar las auditorías" });
  }
};

exports.valorTotalInventario = async (req, res) => {
    try {
        const inventario = await sucursal_producto.findAll({
            include: [
                {
                    model: producto,
                    attributes: ["precio_base"]
                }
            ]
        });

        const total = inventario.reduce((acc, item) => {
            const precio = Number(item.producto?.precio_base || 0);
            return acc + (precio * item.stock_disponible);
        }, 0);

        return res.json({ valor_total: total });
    } catch (error) {
        console.error("Error calculando valor total del inventario:", error);
        return res.status(500).json({ message: "Error calculando valor total del inventario" });
    }
};