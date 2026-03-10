const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const soloAdmin = require('../middlewares/soloAdmin');
const registrarAuditoria = require('../utils/registrarAuditoria');

// GET /api/admin/auditoria
router.get('/', soloAdmin, async (req, res, next) => {
  // Registrar consulta de auditoría
  registrarAuditoria({
    usuario_id: req.usuario.id,
    usuario_nombre: req.usuario.username,
    usuario_rol: req.usuario.rol,
    accion: 'consulta_auditoria',
    modulo: 'Auditoría',
    resultado: 'exito',
    ip: req.ip,
    user_agent: req.headers['user-agent'],
    detalle: 'Consulta de auditoría',
    metadatos: {},
    session_id: req.session ? req.session.id : ''
  });
  next();
});

// GET /api/admin/auditoria/:id
router.get('/:id', auditoriaController.getAuditoriaById);

// GET /api/admin/auditoria/estadisticas
router.get('/estadisticas', auditoriaController.getAuditoriaStats);

// GET /api/admin/auditoria/usuarios
router.get('/usuarios', auditoriaController.getAuditoriaUsuarios);

// GET /api/admin/auditoria/acciones
router.get('/acciones', auditoriaController.getAuditoriaAcciones);

// GET /api/admin/auditoria/linea-tiempo/:usuario_id
router.get('/linea-tiempo/:usuario_id', auditoriaController.getAuditoriaLineaTiempo);

// GET /api/admin/auditoria/exportar
router.get('/exportar', auditoriaController.exportAuditoria);

// GET /api/admin/auditoria/filtros-opciones
router.get('/filtros-opciones', auditoriaController.getAuditoriaFiltrosOpciones);

module.exports = router;
