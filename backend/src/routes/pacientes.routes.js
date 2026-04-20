const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacientes.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.get('/buscar', verifyToken, pacienteController.buscarPacientes);
router.get('/recientes', verifyToken, pacienteController.obtenerPacientesRecientes);
router.get('/:id', verifyToken, pacienteController.obtenerPacienteDetalle);
router.post('/crear-rapido', verifyToken, pacienteController.crearPacienteRapido);
router.put('/:id/odontograma', verifyToken, pacienteController.actualizarOdontograma);

module.exports = router;