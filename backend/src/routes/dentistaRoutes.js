const express = require('express');
const router = express.Router();

// Importamos el controlador
const dentistaController = require('../controllers/dentistaControl');

router.post('/', dentistaController.registrar); 

// Listar
router.get('/', dentistaController.listarTodos);

//Editar
router.put('/:id', dentistaController.editarDatos);

// Inhabilitar/Habilitar
router.patch('/estado/:idUsuario', dentistaController.cambiarEstado);

// Eliminar cuenta
router.delete('/:id', dentistaController.eliminar);

module.exports = router;