// controllers/producto.controller.js
const { GetAllProductos, GetSucursales,abastecerPorProductoSucursal,  crearProductoConStockEnSucursales } = require('../services/serviceInventario');
const{listarProductos, novedades, tendencias}= require('./productoController');
function esAdmin(req) {
  return (
    req.auth?.role === 'administrador' ||
    req.user?.rol?.nombre_rol === 'administrador'
  );
}

exports.listAll = async (req, res) => {
  try {
    return listarProductos(req, res);
  } catch (e) {
    return res.status(400).json({ message: String(e?.message || e) });
  }
};

exports.getSucursales = async(req,res)=>{
    try{
        const data = await GetSucursales(); // trae productos + subcategoria(categoria) + sucursal_producto(sucursal)
        return res.status(200).json(data);
    }catch(e){
        return res.status(400).json({ message: String(e?.message || e) });
    }
};

exports.putAbastecerPorSucursalProducto = async (req, res) => {
  try {
    const id_sucursal = parseInt(req.params.id_sucursal, 10);
    const id_producto = parseInt(req.params.id_producto, 10);
    const { cantidad, modo, etiquetas } = req.body;

    const data = await abastecerPorProductoSucursal({
      id_sucursal,
      id_producto,
      cantidad,
      modo,       // 'sumar' (default en service) | 'reemplazar'
    });

    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: String(e?.message || e) });
  }
};

exports.putAbastecerPorBody = async (req, res) => {
  try {
    const { id_sucursal, id_producto, cantidad, modo, etiquetas } = req.body;

    const data = await abastecerPorProductoSucursal({
      id_sucursal,
      id_producto,
      cantidad,
      modo

    });

    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: String(e?.message || e) });
  }
};


function esAdmin(req) {
  return (
    req.auth?.role === 'administrador' ||
    req.user?.rol?.nombre_rol === 'administrador'
  );
}
// controllers/producto.controller.js
exports.crear = async (req, res) => {
  try {
    const data = await crearProductoConStockEnSucursales(req.body);
    return res.status(201).json(data);
  } catch (e) {
    console.error('❌ Crear producto error:', e);

    if (
      e.name === 'SequelizeValidationError' ||
      e.name === 'SequelizeUniqueConstraintError'
    ) {
      return res.status(400).json({
        name: e.name,
        errors: (e.errors || []).map(err => ({
          message: err.message,
          path: err.path,
          value: err.value,
          validatorKey: err.validatorKey
        }))
      });
    }

    if (e.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        name: e.name,
        index: e.index,
        fields: e.fields,
        table: e.table,
        message: e.parent?.detail || e.message
      });
    }

    return res.status(400).json({ message: String(e?.message || e) });
  }
};