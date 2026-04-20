const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { verifyToken } = require("../middlewares/auth.middleware");
const dentistaController = require('../controllers/dentistaControl');

// ── Configuración multer para fotos de perfil ─────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/fotos/')),
    filename: (req, file, cb) => cb(null, `dentista_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ── Rutas existentes ──────────────────────────────────────────────────────────
router.post('/', dentistaController.registrar);
router.get('/perfil', verifyToken, dentistaController.obtenerPerfil);
router.get('/', dentistaController.listarTodos);
router.put('/:id', dentistaController.editarDatos);
router.patch('/estado/:idUsuario', dentistaController.cambiarEstado);
router.delete('/:id', dentistaController.eliminar);

// ── Opciones de perfil del dentista ──────────────────────────────────────────
router.put('/perfil/editar',    verifyToken, dentistaController.editarPerfil);
router.put('/perfil/password',  verifyToken, dentistaController.cambiarPassword);
router.put('/perfil/foto',      verifyToken, upload.single('foto'), dentistaController.subirFoto);
router.delete('/perfil/foto',   verifyToken, dentistaController.eliminarFoto);  // ── NUEVO

module.exports = router;