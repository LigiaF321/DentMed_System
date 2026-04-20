const express = require('express');
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");

const dentistaController = require('../controllers/dentistaControl');

router.post('/', dentistaController.registrar);

// ✅ MOVER AQUÍ
router.get('/perfil', verifyToken, dentistaController.obtenerPerfil);

// Listar
router.get('/', dentistaController.listarTodos);

//Editar
router.put('/:id', dentistaController.editarDatos);

// Inhabilitar/Habilitar
router.patch('/estado/:idUsuario', dentistaController.cambiarEstado);

// Eliminar cuenta
router.delete('/:id', dentistaController.eliminar);

module.exports = router;