const express = require('express');
const router = express.Router();

const usuariosControllers = require('../controllers/usuarioControllers');

router.post('/', usuariosControllers.forgetPassword);
router.patch('/cambiar-password', usuariosControllers.changePassword);
router.post('/crear-log', usuariosControllers.createLog);
router.get('/get-log/:id_usuario', usuariosControllers.getLogsUsuario);

module.exports = router;
