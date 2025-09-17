const express = require('express');
const router = express.Router();

const listaDeseosControllers = require('../controllers/listaDeseosController');

router.post('/agregar/:id_usuario', listaDeseosControllers.agregarAListaDeseos);
router.get('/get-lista/:id_usuario', listaDeseosControllers.getListaDeseos);

module.exports = router;
