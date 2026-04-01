const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacientes.controller');

router.get('/buscar', pacienteController.buscarPacientes);
router.get('/recientes', pacienteController.obtenerPacientesRecientes);
router.get('/:id', pacienteController.obtenerPacienteDetalle);
router.post('/crear-rapido', pacienteController.crearPacienteRapido);

module.exports = router;