const express = require('express');
const router = express.Router();

const direccionController = require('../controllers/direccionController');


router.get('/municipios', direccionController.getAllMunicipios);
router.get('/departamentos', direccionController.getAllDepartamentos);
router.post('/:id_usuario',direccionController.addDirection);
router.get('/:id_usuario', direccionController.allDirections);
router.patch('/:id_usuario', direccionController.direccionDefault);
router.put('/:id_usuario/:id_direccion', direccionController.actualizarDireccion);
router.delete('/:id_usuario/:id_direccion', direccionController.eliminarDireccion);

module.exports = router;