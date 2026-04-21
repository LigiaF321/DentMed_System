const express = require('express');
const router = express.Router();
const restauracionController = require('../controllers/restauracion.controller');

// --- SEGURIDAD 
router.post('/verificar-credenciales', restauracionController.verificarCredenciales);
router.post('/credenciales', restauracionController.configurarCredenciales);

// --- GESTIÓN DE BACKUPS 
router.get('/backups', restauracionController.listarBackups);
router.get('/backups/:id/detalle', restauracionController.detalleBackup);

// --- SELECCIÓN GUIADA 
router.get('/tipos', restauracionController.obtenerTiposRestauracion); 
router.get('/tablas', restauracionController.obtenerTablasSeleccion); 

// --- EJECUCIÓN Y PROGRESO 
router.post('/simular', restauracionController.simular);
router.post('/backup-seguridad', restauracionController.backupSeguridad);
router.post('/ejecutar', restauracionController.ejecutar);
router.get('/progreso/:id', restauracionController.obtenerProgreso);

// --- REPORTES 
router.get('/reporte/:id', restauracionController.generarReporte);

module.exports = router;