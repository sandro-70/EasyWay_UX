const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/InicioUsuarioController');
const verificarToken = require('../middleware/verificarToken');

router.get('/info/role/:id_role', verificarToken, ctrl.infoRoleById);
router.get('/info/:id', verificarToken, ctrl.infoById);
router.put('/perfil', verificarToken, ctrl.updateMe);      // yo mismo
router.put('/perfil/:id', verificarToken, ctrl.updateById); // admin

module.exports = router;