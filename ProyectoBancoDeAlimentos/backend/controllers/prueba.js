// controllers/testRelaciones.controller.js
const {
  // Catálogo / ventas
  producto,
  factura_detalle,
  pedido,
  // Promociones
  promocion,
  promocion_producto,
  promocion_pedido,
  cupon,
  historial_cupon,
  

  // Seguridad / roles
  Usuario,
  rol,
  privilegio,
  rol_privilegio,
  imagen_producto,
  subcategoria,
  marca_producto,
} = require('../models');

const testRelaciones = async (req, res) => {
  try {
    // 1) Productos con sus promociones (vía tabla puente) y con líneas de factura donde aparecieron
    const productos = await producto.findAll({
        include: [
          { model: imagen_producto, as: 'imagen_productos' },
          { model: subcategoria, as: 'subcategoria' },
          { model: marca_producto, as: 'marca_producto' },
        ],
      });
      res.json(productos);

    // 2) Pedidos con: usuario, promociones aplicadas (puente), detalle de factura y cupón (si hubo)
    const pedidos = await pedido.findAll({
      include: [
        { model: Usuario, required: false },    // cliente que hizo el pedido
        {
          model: promocion_pedido,              // puente pedido <-> promocion
          include: [{ model: promocion }],
          required: false,
        },
        { model: factura_detalle, required: false },
        { model: cupon, required: false },
      ],
    });

    

    // 3) Roles con sus privilegios (many-to-many vía rol_privilegio)
    const roles = await rol.findAll({
      include: [
        {
          model: privilegio,
          through: { model: rol_privilegio, attributes: [] },
          required: false,
        },
      ],
    });

    // 4) Cupones con su historial de uso
    const cupones = await cupon.findAll({
      include: [{ model: historial_cupon, required: false }],
    });

  
    res.json({
      ok: true,
      resumen: {
        productos: productos.length,
        pedidos: pedidos.length,
        roles: roles.length,
        cupones: cupones.length,
      },
      data: { productos, pedidos, roles, cupones },
    });

  } catch (err) {
    console.error('[testRelaciones] Error:', err);
    res.status(500).json({ error: 'Error al obtener los datos de prueba', detalle: String(err) });
  }
};

module.exports = { testRelaciones };
