const express = require('express');
const router = express.Router();
const dentistaController = require('../controllers/dentistaControl');

// CORRECCIÓN: Quitamos la 's' para que coincida con tu carpeta física
const { verifyToken } = require("../middleware/auth.middleware");

// Tareas de Administrador (Tarea 2.1)
// He añadido 'verifyToken' a las rutas para que solo el Admin con token pueda usarlas
router.post('/', verifyToken, dentistaController.registrar); 
router.get('/', verifyToken, dentistaController.listarTodos);
router.put('/:id', verifyToken, dentistaController.editarDatos);
router.patch('/estado/:idUsuario', verifyToken, dentistaController.cambiarEstado);
router.delete('/:id', verifyToken, dentistaController.eliminar);

module.exports = router;