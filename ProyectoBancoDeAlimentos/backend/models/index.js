const Sequelize = require('sequelize');
const sequelize = require('../config/db');
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cookieParser());

const models = {
  Usuario: require('./Usuario')
};

// Ejecutar asociaciones si el modelo tiene associate()
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Cargar todos los modelos
const carrito               = require('./carrito.js')(sequelize, Sequelize.DataTypes);
const carrito_detalle       = require('./carrito_detalle.js')(sequelize, Sequelize.DataTypes);
const categoria             = require('./categoria.js')(sequelize, Sequelize.DataTypes);
const cupon                 = require('./cupon.js')(sequelize, Sequelize.DataTypes);
const departamento          = require('./departamento.js')(sequelize, Sequelize.DataTypes);
const direccion             = require('./direccion.js')(sequelize, Sequelize.DataTypes);
const historial_cupon       = require('./historial_cupon.js')(sequelize, Sequelize.DataTypes);
const factura               = require('./factura')(sequelize, Sequelize.DataTypes);
const factura_detalle       = require('./factura_detalle.js')(sequelize, Sequelize.DataTypes);
const imagen_producto       = require('./imagen_producto.js')(sequelize, Sequelize.DataTypes);
const marca_producto        = require('./marca_producto.js')(sequelize, Sequelize.DataTypes);
const municipio             = require('./municipio.js')(sequelize, Sequelize.DataTypes);
const pedido                = require('./pedido.js')(sequelize, Sequelize.DataTypes);
const privilegio            = require('./privilegio.js')(sequelize, Sequelize.DataTypes);
const producto              = require('./producto.js')(sequelize, Sequelize.DataTypes);
const promocion             = require('./promocion.js')(sequelize, Sequelize.DataTypes);
const promocion_pedido      = require('./promocion_pedido.js')(sequelize, Sequelize.DataTypes);
const promocion_producto    = require('./promocion_producto.js')(sequelize, Sequelize.DataTypes);
const rol                   = require('./rol.js')(sequelize, Sequelize.DataTypes);
const rol_privilegio        = require('./rol_privilegio.js')(sequelize, Sequelize.DataTypes);
const subcategoria          = require('./subcategoria.js')(sequelize, Sequelize.DataTypes);
const sucursal              = require('./sucursal.js')(sequelize, Sequelize.DataTypes);
const sucursal_producto     = require('./sucursal_producto.js')(sequelize, Sequelize.DataTypes);
const Usuario               = require('./Usuario.js')(sequelize, Sequelize.DataTypes);
const valoracion_producto   = require('./valoracion_producto.js')(sequelize, Sequelize.DataTypes);
const metodo_pago           = require('./metodo_pago.js')(sequelize, Sequelize.DataTypes);
const estado_pedido         = require('./estado_pedido.js')(sequelize, Sequelize.DataTypes);
const historial_accesos     = require('./historial_accesos.js')(sequelize, Sequelize.DataTypes);
const lista_deseos          = require('./lista_deseos.js')(sequelize, Sequelize.DataTypes);
const usuario_log          = require('./usuario_log.js')(sequelize, Sequelize.DataTypes);

// ================== ASOCIACIONES ================== //


Usuario.hasMany(usuario_log, { foreignKey: 'id_usuario' });
usuario_log.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// --- Identity ---
Usuario.hasMany(historial_accesos, { foreignKey: 'id_usuario' });
historial_accesos.belongsTo(Usuario, { foreignKey: 'id_usuario' });

rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(rol, { foreignKey: 'id_rol' });

rol.belongsToMany(privilegio, { through: rol_privilegio, foreignKey: 'id_rol', otherKey: 'id_privilegio' });
privilegio.belongsToMany(rol, { through: rol_privilegio, foreignKey: 'id_privilegio', otherKey: 'id_rol' });

// --- Pedidos / Estado ---
estado_pedido.hasMany(pedido, { foreignKey: 'id_estado_pedido' });
pedido.belongsTo(estado_pedido, { foreignKey: 'id_estado_pedido' });

cupon.hasMany(pedido, { foreignKey: 'id_cupon' });
pedido.belongsTo(cupon, { foreignKey: 'id_cupon' });

Usuario.hasMany(pedido, { foreignKey: 'id_usuario' });
pedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });

sucursal.hasMany(pedido, { foreignKey: 'id_sucursal' });
pedido.belongsTo(sucursal, { foreignKey: 'id_sucursal' });

// --- Direcciones / Ubicación ---
departamento.hasMany(municipio, { foreignKey: 'id_departamento' });
municipio.belongsTo(departamento, { foreignKey: 'id_departamento' });

municipio.hasMany(direccion, { foreignKey: 'id_municipio' });
direccion.belongsTo(municipio, { foreignKey: 'id_municipio' });

municipio.hasMany(sucursal, { foreignKey: 'id_municipio' });
sucursal.belongsTo(municipio, { foreignKey: 'id_municipio' });

Usuario.hasMany(direccion, { foreignKey: 'id_usuario' });
direccion.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// --- Categorías ---
categoria.hasMany(subcategoria, { foreignKey: 'id_categoria_padre' });
subcategoria.belongsTo(categoria, { foreignKey: 'id_categoria_padre', as: 'categoria' });

subcategoria.hasMany(producto, { foreignKey: "id_subcategoria", as: 'productos' });
producto.belongsTo(subcategoria, { foreignKey: "id_subcategoria", as: 'subcategoria' });

// --- Producto ---
marca_producto.hasMany(producto, { foreignKey: 'id_marca' });
producto.belongsTo(marca_producto, { foreignKey: 'id_marca', as: 'marca' });

producto.hasMany(imagen_producto, { foreignKey: 'id_producto', as: 'imagenes' });
imagen_producto.belongsTo(producto, { foreignKey: 'id_producto' });

producto.hasMany(valoracion_producto, { foreignKey: 'id_producto' });
valoracion_producto.belongsTo(producto, { foreignKey: 'id_producto' });

Usuario.hasMany(valoracion_producto, { foreignKey: 'id_usuario' });
valoracion_producto.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// --- Stock / Sucursales ---
sucursal.hasMany(sucursal_producto, { foreignKey: 'id_sucursal' });
sucursal_producto.belongsTo(sucursal, { foreignKey: 'id_sucursal' });

producto.hasMany(sucursal_producto, { foreignKey: 'id_producto', as: 'stock' });
sucursal_producto.belongsTo(producto, { foreignKey: 'id_producto' });

// --- Carrito ---
Usuario.hasOne(carrito, { foreignKey: 'id_usuario' });
carrito.belongsTo(Usuario, { foreignKey: 'id_usuario' });

carrito.hasMany(carrito_detalle, { foreignKey: 'id_carrito' });
carrito_detalle.belongsTo(carrito, { foreignKey: 'id_carrito' });

producto.hasMany(carrito_detalle, { foreignKey: 'id_producto' });
carrito_detalle.belongsTo(producto, { foreignKey: 'id_producto' });

// --- Facturas ---
pedido.hasOne(factura, { foreignKey: 'id_pedido' });
factura.belongsTo(pedido, { foreignKey: 'id_pedido' });

factura.hasMany(factura_detalle, { foreignKey: 'id_factura' });
factura_detalle.belongsTo(factura, { foreignKey: 'id_factura' });

producto.hasMany(factura_detalle, { foreignKey: 'id_producto' });
factura_detalle.belongsTo(producto, { foreignKey: 'id_producto' });

// --- Promociones ---
promocion.belongsToMany(producto, { through: promocion_producto, foreignKey: 'id_promocion', otherKey: 'id_producto' });
producto.belongsToMany(promocion, { through: promocion_producto, foreignKey: 'id_producto', otherKey: 'id_promocion' });

promocion.belongsToMany(pedido, { through: promocion_pedido, foreignKey: 'id_promocion', otherKey: 'id_pedido' });
pedido.belongsToMany(promocion, { through: promocion_pedido, foreignKey: 'id_pedido', otherKey: 'id_promocion' });

// --- Cupones ---
cupon.hasMany(historial_cupon, { foreignKey: 'id_cupon' });
historial_cupon.belongsTo(cupon, { foreignKey: 'id_cupon' });

Usuario.hasMany(historial_cupon, { foreignKey: 'id_usuario' });
historial_cupon.belongsTo(Usuario, { foreignKey: 'id_usuario' });

pedido.hasMany(historial_cupon, { foreignKey: 'id_pedido' });
historial_cupon.belongsTo(pedido, { foreignKey: 'id_pedido' });

// --- Direccion - Metodo Pago ---
direccion.hasMany(metodo_pago, { foreignKey: 'id_direccion_facturacion' });
metodo_pago.belongsTo(direccion, { foreignKey: 'id_direccion_facturacion' });

metodo_pago.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasOne(metodo_pago, { foreignKey: 'id_usuario' });

// --- Lista deseos ---
Usuario.hasMany(lista_deseos, { foreignKey: 'id_usuario' });
lista_deseos.belongsTo(Usuario, { foreignKey: 'id_usuario' });

producto.hasMany(lista_deseos, { foreignKey: 'id_producto' });
lista_deseos.belongsTo(producto, { foreignKey: 'id_producto' });

// ================== EXPORT ================== //
module.exports = {
  carrito,
  carrito_detalle,
  categoria,
  cupon,
  departamento,
  direccion,
  historial_cupon,
  imagen_producto,
  marca_producto,
  municipio,
  pedido,
  factura,
  factura_detalle,
  privilegio,
  producto,
  promocion,
  promocion_pedido,
  promocion_producto,
  rol,
  rol_privilegio,
  subcategoria,
  sucursal,
  sucursal_producto,
  Usuario,
  valoracion_producto,
  sequelize,
  Sequelize,
  metodo_pago,
  estado_pedido,
  historial_accesos,
  lista_deseos,
  usuario_log
};
