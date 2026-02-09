const express = require('express');
const router = express.Router();

// Importamos el controlador
const dentistaController = require('../controllers/dentistaControl');

// --- AQUÍ ESTABA EL ERROR: Faltaba esta línea para el registro ---
router.post('/', dentistaController.registrar); 

// TAREA 1: Listar
router.get('/', dentistaController.listarTodos);

// TAREA 2: Editar
router.put('/:id', dentistaController.editarDatos);

// TAREA 3 y 4: Inhabilitar/Habilitar
router.patch('/estado/:idUsuario', dentistaController.cambiarEstado);

// TAREA 5: Eliminar cuenta
router.delete('/:id', dentistaController.eliminar);

module.exports = router;