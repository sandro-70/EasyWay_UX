const express = require('express');
const router = express.Router();

const listaDeseosControllers = require('../controllers/listaDeseosController');

router.delete('/eliminar/:id_usuario/:id_producto', listaDeseosControllers.eliminarDeListaDeseos);
router.delete('/vaciar/:id_usuario', listaDeseosControllers.vaciarListaDeseos);

router.post('/agregar/:id_usuario', listaDeseosControllers.agregarAListaDeseos);
router.get('/get-lista/:id_usuario', listaDeseosControllers.getListaDeseos);

module.exports = router;
