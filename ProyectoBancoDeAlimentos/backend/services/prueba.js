/* 
const express = require('express');
const router = express.Router();
const {
  carrito,
  carrito_detalle,
  producto,
  subcategoria,
  categoria,
  imagen_producto,
  valoracion_producto,
  sucursal_producto,
  sucursal,
  municipio,
  departamento,
  direccion,
  marca_producto
} = require('../models');

router.get('/test-relaciones', async (req, res) => {
  try {
    //Se agarra un carrito
    const carritos = await carrito.findAll({
      include: [
        {
          model: carrito_detalle,
          include: [
            {
              model: producto,
              include: [
                { model: subcategoria, include: [categoria] },
                { model: imagen_producto },
                { model: valoracion_producto },
                { model: sucursal_producto, include: [sucursal] },
                { model: marca_producto }
              ]
            }
          ]
        }
      ]
    });
    
    res.json(carritos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los datos de prueba' });
  }
});

module.exports = router;
*/