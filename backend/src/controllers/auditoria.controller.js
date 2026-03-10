const Auditoria = require('../models/Auditoria');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const { getCachedStats } = require('../utils/cacheAuditoria');
const { getCachedFilters } = require('../utils/cacheAuditoria');

// GET /api/admin/auditoria (keyset pagination)
exports.getAuditoria = async (req, res) => {
  try {
    const {
      usuario_id,
      usuario_nombre,
      rol,
      fecha_desde,
      fecha_hasta,
      accion,
      modulo,
      resultado,
      ip,
      busqueda,
      limite = 50,
      orden = 'fecha_desc',
      incluir_archivo = false,
      cursor // id del último registro de la página anterior
    } = req.query;

    // Construir filtros
    const where = {};
    if (usuario_id) where.usuario_id = usuario_id;
    if (usuario_nombre) where.usuario_nombre = { [Op.like]: `%${usuario_nombre}%` };
    if (rol && rol !== 'todos') where.usuario_rol = rol;
    if (fecha_desde) where.fecha_hora = { [Op.gte]: fecha_desde };
    if (fecha_hasta) where.fecha_hora = { ...(where.fecha_hora || {}), [Op.lte]: fecha_hasta };
    if (accion) where.accion = accion;
    if (modulo) where.modulo = modulo;
    if (resultado && resultado !== 'todos') where.resultado = resultado;
    if (ip) where.ip = { [Op.like]: `%${ip}%` };
    if (busqueda) {
      where[Op.or] = [
        { detalle: { [Op.like]: `%${busqueda}%` } },
        { metadatos: { [Op.like]: `%${busqueda}%` } }
      ];
    }
    // Keyset pagination
    if (cursor) {
      where.id = { [Op.lt]: cursor }; // Para paginación descendente
    }
    let order = [['id', 'DESC']];
    if (orden === 'fecha_asc') order = [['fecha_hora', 'ASC']];
    else if (orden === 'usuario') order = [['usuario_nombre', 'ASC']];

    let registros = [], count = 0;
    if (incluir_archivo === 'true' || incluir_archivo === true) {
      const AuditoriaArchivo = require('../models/AuditoriaArchivo');
      const [principal, archivo] = await Promise.all([
        Auditoria.findAll({ where, order, limit: Math.min(parseInt(limite), 500) }),
        AuditoriaArchivo.findAll({ where, order })
      ]);
      registros = [...principal, ...archivo];
      count = registros.length;
    } else {
      const principal = await Auditoria.findAll({ where, order, limit: Math.min(parseInt(limite), 500) });
      registros = principal;
      count = registros.length;
    }
    // Nuevo cursor para la siguiente página
    const nextCursor = registros.length ? registros[registros.length - 1].id : null;
    res.json({
      limite: parseInt(limite),
      total: count,
      registros,
      nextCursor
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar auditoría', details: err.message });
  }
};

// GET /api/admin/auditoria/:id
// Detalle de un registro de auditoría y sus cambios asociados
exports.getAuditoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await Auditoria.findByPk(id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });

    // Buscar cambios asociados
    const AuditoriaCambios = require('../models/AuditoriaCambios');
    const cambios = await AuditoriaCambios.findAll({ where: { auditoria_id: id } });

    res.json({ ...registro.toJSON(), cambios });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar detalle de auditoría', details: err.message });
  }
};

// GET /api/admin/auditoria/estadisticas
// Estadísticas rápidas de auditoría
exports.getAuditoriaStats = async (req, res) => {
  try {
    const stats = await getCachedStats('auditoria_stats', async () => {
      const Auditoria = require('../models/Auditoria');
      const { Op } = require('sequelize');
      const hoy = new Date();
      const hace7dias = new Date(hoy);
      hace7dias.setDate(hoy.getDate() - 7);
      const total = await Auditoria.count();
      const ultimos7 = await Auditoria.count({ where: { fecha_hora: { [Op.gte]: hace7dias } } });
      const usuariosHoy = await Auditoria.count({ where: { fecha_hora: { [Op.gte]: hoy.setHours(0,0,0,0) } }, distinct: true, col: 'usuario_id' });
      const eventosCriticos = await Auditoria.count({ where: { resultado: { [Op.in]: ['fallido', 'bloqueado'] } } });
      return {
        total_registros: total,
        ultimos_7_dias: ultimos7,
        usuarios_activos_hoy: usuariosHoy,
        eventos_criticos: eventosCriticos
      };
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar estadísticas', details: err.message });
  }
};

// GET /api/admin/auditoria/usuarios
// Lista de usuarios únicos para filtros
exports.getAuditoriaUsuarios = async (req, res) => {
  try {
    const Auditoria = require('../models/Auditoria');
    // Obtener usuarios únicos
    const usuarios = await Auditoria.findAll({
      attributes: [
        'usuario_id',
        'usuario_nombre',
        'usuario_rol'
      ],
      group: ['usuario_id', 'usuario_nombre', 'usuario_rol'],
      order: [['usuario_nombre', 'ASC']]
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar usuarios de auditoría', details: err.message });
  }
};

// GET /api/admin/auditoria/acciones
// Lista de acciones agrupadas por módulo
exports.getAuditoriaAcciones = async (req, res) => {
  try {
    const Auditoria = require('../models/Auditoria');
    // Obtener acciones agrupadas por módulo
    const acciones = await Auditoria.findAll({
      attributes: ['modulo', 'accion'],
      group: ['modulo', 'accion'],
      order: [['modulo', 'ASC'], ['accion', 'ASC']]
    });
    // Agrupar por módulo
    const agrupadas = {};
    acciones.forEach(a => {
      const m = a.modulo;
      if (!agrupadas[m]) agrupadas[m] = [];
      agrupadas[m].push(a.accion);
    });
    res.json(agrupadas);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar acciones de auditoría', details: err.message });
  }
};

// GET /api/admin/auditoria/linea-tiempo/:usuario_id
// Línea de tiempo de actividad por usuario
exports.getAuditoriaLineaTiempo = async (req, res) => {
  try {
    const Auditoria = require('../models/Auditoria');
    const { usuario_id } = req.params;
    const { fecha_desde, fecha_hasta, agrupar_por = 'dia' } = req.query;
    const where = { usuario_id };
    if (fecha_desde) where.fecha_hora = { [Op.gte]: fecha_desde };
    if (fecha_hasta) where.fecha_hora = { ...(where.fecha_hora || {}), [Op.lte]: fecha_hasta };

    // Agrupación dinámica
    let groupField = null;
    if (agrupar_por === 'hora') groupField = [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_hora'), '%Y-%m-%d %H:00')];
    else if (agrupar_por === 'dia') groupField = [sequelize.fn('DATE', sequelize.col('fecha_hora'))];
    else if (agrupar_por === 'semana') groupField = [sequelize.fn('YEARWEEK', sequelize.col('fecha_hora'))];
    else if (agrupar_por === 'mes') groupField = [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_hora'), '%Y-%m')];

    const datos = await Auditoria.findAll({
      attributes: [
        [groupField[0], 'periodo'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      where,
      group: ['periodo'],
      order: [['periodo', 'ASC']]
    });

    // Total acciones
    const total_acciones = await Auditoria.count({ where });
    // Pico de actividad
    let dia_max = null, cantidad_max = 0, hora_max = null;
    if (datos.length > 0) {
      const max = datos.reduce((a, b) => a.cantidad > b.cantidad ? a : b);
      dia_max = max.periodo;
      cantidad_max = max.cantidad;
      // Hora más activa (solo si agrupar_por es hora)
      if (agrupar_por === 'hora') hora_max = max.periodo;
    }

    // Info usuario
    const primerRegistro = await Auditoria.findOne({ where, order: [['fecha_hora', 'ASC']] });
    res.json({
      usuario_id,
      usuario_nombre: primerRegistro ? primerRegistro.usuario_nombre : '',
      usuario_completo: '', // Puedes agregar nombre completo si lo tienes
      total_acciones,
      datos,
      picos: { dia_max, cantidad_max, hora_max }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar línea de tiempo', details: err.message });
  }
};

// GET /api/admin/auditoria/exportar
// Exportar registros de auditoría en CSV o PDF
exports.exportAuditoria = async (req, res) => {
  try {
    const {
      usuario_id,
      usuario_nombre,
      rol,
      fecha_desde,
      fecha_hasta,
      accion,
      modulo,
      resultado,
      ip,
      busqueda,
      formato = 'csv'
    } = req.query;
    const where = {};
    if (usuario_id) where.usuario_id = usuario_id;
    if (usuario_nombre) where.usuario_nombre = { [Op.like]: `%${usuario_nombre}%` };
    if (rol && rol !== 'todos') where.usuario_rol = rol;
    if (fecha_desde) where.fecha_hora = { [Op.gte]: fecha_desde };
    if (fecha_hasta) where.fecha_hora = { ...(where.fecha_hora || {}), [Op.lte]: fecha_hasta };
    if (accion) where.accion = accion;
    if (modulo) where.modulo = modulo;
    if (resultado && resultado !== 'todos') where.resultado = resultado;
    if (ip) where.ip = { [Op.like]: `%${ip}%` };
    if (busqueda) {
      where[Op.or] = [
        { detalle: { [Op.like]: `%${busqueda}%` } },
        { metadatos: { [Op.like]: `%${busqueda}%` } }
      ];
    }
    const registros = await Auditoria.findAll({ where });
    if (formato === 'csv') {
      const fields = ['id','fecha_hora','usuario_id','usuario_nombre','usuario_rol','accion','modulo','resultado','ip','detalle','metadatos','user_agent'];
      const parser = new Parser({ fields });
      const csv = parser.parse(registros.map(r => r.toJSON()));
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=auditoria.csv');
      return res.send(csv);
    }
    // Para PDF: solo estructura base (requiere librería extra)
    if (formato === 'pdf') {
      // Aquí puedes usar pdfkit, jsPDF, etc.
      return res.status(501).json({ error: 'Exportación a PDF no implementada aún' });
    }
    res.status(400).json({ error: 'Formato no soportado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar auditoría', details: err.message });
  }
};

// GET /api/admin/auditoria/filtros-opciones
// Opciones de filtros para auditoría
exports.getAuditoriaFiltrosOpciones = async (req, res) => {
  try {
    const filtros = await getCachedFilters('auditoria_filtros', async () => {
      const Auditoria = require('../models/Auditoria');
      // Usuarios
      const usuarios = await Auditoria.findAll({
        attributes: ['id_usuario'],
        group: ['id_usuario'],
        order: [['id_usuario', 'ASC']]
      });
      // Acciones
      const acciones = await Auditoria.findAll({
        attributes: ['accion'],
        group: ['accion'],
        order: [['accion', 'ASC']]
      });
      // Módulos
      const modulos = await Auditoria.findAll({
        attributes: ['modulo'],
        group: ['modulo'],
        order: [['modulo', 'ASC']]
      });
      // Resultados posibles (simulado, puedes adaptar si tienes campo resultado)
      const resultados = ['exito', 'fallido', 'bloqueado', 'advertencia'];
      return { usuarios, acciones, modulos, resultados };
    });
    res.json(filtros);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar opciones de filtros', details: err.message });
  }
};
