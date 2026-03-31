const express = require('express');
const router = express.Router();
const bloquesController = require('../controllers/bloques.controller');

router.get('/', bloquesController.obtenerBloques);
router.post('/', bloquesController.crearBloqueo);
router.delete('/:id', bloquesController.eliminarBloque);

module.exports = router;