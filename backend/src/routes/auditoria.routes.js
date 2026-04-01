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

/**
 * TAREA B6: REGISTRAR AUDITORÍA (Mantenimiento de Consultorios)
 * Se añade al final para no interferir con las rutas GET existentes
 */
router.post('/consultorios', async (req, res) => {
  try {
    const { accion, modulo, detalle } = req.body;
    
    // Datos de seguridad (fallback a valores por defecto si no hay sesión)
    const datosAuditoria = {
      usuario_id: req.usuario ? req.usuario.id : 1,
      usuario_nombre: req.usuario ? req.usuario.username : 'Admin_Pruebas',
      usuario_rol: req.usuario ? req.usuario.rol : 'Administrador',
      accion: accion || 'ACCION_DESCONOCIDA',
      modulo: modulo || 'CONSULTORIOS',
      resultado: 'exito',
      ip: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Postman/Testing',
      detalle: detalle || 'Registro manual de auditoría',
      metadatos: {},
      session_id: req.session ? req.session.id : 'N/A'
    };

    // Llamada segura a la utilidad de los compañeros
    if (typeof registrarAuditoria === 'function') {
      await registrarAuditoria(datosAuditoria);
    } else if (registrarAuditoria && typeof registrarAuditoria.registrarAuditoria === 'function') {
      await registrarAuditoria.registrarAuditoria(datosAuditoria);
    }

    return res.status(201).json({
      ok: true,
      message: "Auditoría de consultorio registrada exitosamente"
    });
  } catch (error) {
    console.error("Error en B6 Auditoría:", error);
    return res.status(500).json({
      ok: false,
      message: "No se pudo registrar la auditoría"
    });
  }
});

module.exports = router;