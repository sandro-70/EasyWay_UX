const express = require('express');
const router  = express.Router();

const { login } = require('../controllers/AuthController');
const verificarToken = require('../middleware/verificarToken');
const {GetAllUser} = require('../controllers/InicioUsuarioController');

router.post('/login', login);
router.get('/perfil', verificarToken, (req, res) => res.json(req.user));
router.get('/GetAllUser', verificarToken, GetAllUser);
module.exports = router;