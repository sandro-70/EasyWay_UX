const express = require('express');
const router = express.Router();
const pruebaController = require('../controllers/testController');

router.get('/', pruebaController.verifictestarRuta);

module.exports = router;