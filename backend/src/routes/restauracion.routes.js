const express = require('express');
const router = express.Router();
// Asegúrate de que la ruta al archivo sea correcta
const restauracionController = require('../controllers/restauracion.controller');

router.post('/verificar-credenciales', restauracionController.verificarCredenciales);
router.get('/backups', restauracionController.listarBackups);
router.post('/simular', restauracionController.simular);
router.post('/backup-seguridad', restauracionController.backupSeguridad);
router.post('/ejecutar', restauracionController.ejecutar);

module.exports = router;