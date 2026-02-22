const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Asegúrate de que estos nombres coincidan EXACTAMENTE con los 'exports' de arriba
router.get('/validar-email', authController.validarEmail);
router.post('/dentistas', authController.crearDentista);
router.post('/login', authController.login);
router.post('/force-change-password', authController.forceChangePassword);
router.get('/medico-dashboard', authController.getMedicoDashboard);

module.exports = router;