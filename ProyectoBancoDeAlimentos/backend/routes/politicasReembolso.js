const express = require('express');
const router = express.Router();
const politicaController = require('../controllers/politicasReembolso');

router.post('/agregar', politicaController.agregarPolitica);
router.get('/listar', politicaController.listarPoliticas);
router.delete('/eliminar/:id', politicaController.eliminarPolitica);

module.exports = router;

