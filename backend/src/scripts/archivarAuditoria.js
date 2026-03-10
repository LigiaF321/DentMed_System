const Auditoria = require('../models/Auditoria');
const AuditoriaArchivo = require('../models/AuditoriaArchivo');
const Configuracion = require('../models/Configuracion');
const { Op } = require('sequelize');

async function archivarAuditoria() {
  // Obtener meses de retención desde configuración
  let mesesRetencion = 12;
  try {
    const config = await Configuracion.findOne({ where: { clave: 'meses_retencion_auditoria' } });
    if (config && config.valor) mesesRetencion = parseInt(config.valor);
  } catch (e) { /* usar default */ }

  const fechaLimite = new Date();
  fechaLimite.setMonth(fechaLimite.getMonth() - mesesRetencion);

  // Buscar registros antiguos
  const registros = await Auditoria.findAll({ where: { fecha_hora: { [Op.lt]: fechaLimite } } });
  if (!registros.length) return console.log('No hay registros antiguos para archivar.');

  // Mover a archivo
  const datosArchivo = registros.map(r => r.toJSON());
  await AuditoriaArchivo.bulkCreate(datosArchivo);

  // Eliminar de tabla principal
  await Auditoria.destroy({ where: { fecha_hora: { [Op.lt]: fechaLimite } } });

  console.log(`Archivados ${registros.length} registros de auditoría.`);
}

// Para ejecución manual
if (require.main === module) {
  archivarAuditoria().then(() => process.exit(0));
}

module.exports = archivarAuditoria;
