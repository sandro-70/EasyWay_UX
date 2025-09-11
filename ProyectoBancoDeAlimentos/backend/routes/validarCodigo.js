const express = require('express');
const router = express.Router();

const usuariosControllers = require('../controllers/usuarioControllers');

router.post('/', usuariosControllers.validarCodigo);

module.exports = router;