const cron = require('node-cron');
const archivarAuditoria = require('./archivarAuditoria');

// Ejecutar el primer día de cada mes a las 2:00 AM
cron.schedule('0 2 1 * *', () => {
  console.log('Ejecutando tarea de archivado de auditoría...');
  archivarAuditoria();
});

module.exports = {}; // Solo para importar si se requiere
