const express = require('express');
const multer = require('multer');
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");

const dentistaController = require('../controllers/dentistaControl');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file) {
      cb(null, true);
      return;
    }
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes para la foto de perfil'));
    }
  },
});

router.post('/', dentistaController.registrar);

// Perfil
router.get('/perfil', verifyToken, dentistaController.obtenerPerfil);
router.put('/perfil', verifyToken, upload.single('avatar'), dentistaController.actualizarPerfil);
router.put('/perfil/cambiar-contrasena', verifyToken, dentistaController.cambiarContrasena);

// Listar
router.get('/', dentistaController.listarTodos);

//Editar
router.put('/:id', dentistaController.editarDatos);

// Inhabilitar/Habilitar
router.patch('/estado/:idUsuario', dentistaController.cambiarEstado);

// Eliminar cuenta
router.delete('/:id', dentistaController.eliminar);

module.exports = router;