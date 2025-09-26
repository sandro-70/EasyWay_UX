const express = require('express');
const router = express.Router();
const reembolsoController = require('../controllers/reembolsoController');

router.post('/agregar', reembolsoController.agregarReembolso);
router.get('/listar', reembolsoController.listarReembolsos);

module.exports = router;