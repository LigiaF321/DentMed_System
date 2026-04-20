// backend/src/routes/adminPanel.routes.js
const express  = require('express');
const router   = express.Router();
const path     = require('path');
const multer   = require('multer');

const adminPanel      = require('../controllers/adminPanel.controller');
const adminPerfil     = require('../controllers/adminPerfil.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const configuracionRoutes = require('./configuracion.routes');

// ── Multer para foto del admin ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/fotos/')),
  filename:    (req, file, cb) => cb(null, `admin_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ── Rutas existentes ──────────────────────────────────────────────────────────
router.get('/panel-principal', adminPanel.getPanelPrincipal);
router.use('/configuracion', configuracionRoutes);

// ── NUEVAS: perfil del admin ──────────────────────────────────────────────────
router.get('/perfil',             verifyToken, adminPerfil.obtenerPerfil);
router.put('/perfil',             verifyToken, adminPerfil.editarPerfil);
router.put('/cambiar-password',   verifyToken, adminPerfil.cambiarPassword);
router.put('/foto',               verifyToken, upload.single('foto'), adminPerfil.subirFoto);
router.delete('/foto',            verifyToken, adminPerfil.eliminarFoto);

module.exports = router;