const express = require('express');
const router  = express.Router();
const categoriaCtrl = require('../controllers/categoriaController');

router
  .get('/',     categoriaCtrl.listar)
  .get('/:id',  categoriaCtrl.obtener)
  .post('/',    categoriaCtrl.crear)
  .put('/:id',  categoriaCtrl.actualizar)
  .delete('/:id', categoriaCtrl.desactivarProductos);

module.exports = router;