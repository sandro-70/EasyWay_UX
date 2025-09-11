const express = require('express');
const router = express.Router();
const { testRelaciones } = require('../controllers/prueba');
const auth = require('../middleware/verificarToken');
// Ruta para probar las relaciones entre models
router.get('/test-relaciones', testRelaciones);

// routes/auth.routes.js


router.get('/me', auth, (req, res) => {
  return res.json({
    userId: req.auth?.userId,
    role: req.auth?.role,
    user: req.user, // incluirá id_usuario, nombre, correo, rol.nombre_rol
  });
});

module.exports = router;

module.exports = router;
