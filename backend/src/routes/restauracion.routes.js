const express = require('express');
const router = express.Router();
const restauracionController = require('../controllers/restauracion.controller');

// --- SEGURIDAD (Paso 1 y 2) ---
router.post('/verificar-credenciales', restauracionController.verificarCredenciales);
router.post('/credenciales', restauracionController.configurarCredenciales);

// --- GESTIÓN DE BACKUPS (Paso 4) ---
router.get('/backups', restauracionController.listarBackups);
router.get('/backups/:id/detalle', restauracionController.detalleBackup);

// --- SELECCIÓN GUIADA (Paso 1 y 2 del Wizard) ---
router.get('/tipos', restauracionController.obtenerTiposRestauracion); 
router.get('/tablas', restauracionController.obtenerTablasSeleccion); 

// --- EJECUCIÓN Y PROGRESO (Paso 5, 6 y 7) ---
router.post('/simular', restauracionController.simular);
router.post('/backup-seguridad', restauracionController.backupSeguridad);
router.post('/ejecutar', restauracionController.ejecutar);
router.get('/progreso/:id', restauracionController.obtenerProgreso);

// --- REPORTES (Paso 8) ---
router.get('/reporte/:id', restauracionController.generarReporte);

module.exports = router;