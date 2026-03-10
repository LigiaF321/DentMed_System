const Auditoria = require('../models/Auditoria');

function enmascararIP(ip) {
  if (!ip) return '';
  const partes = ip.split('.');
  if (partes.length === 4) return `${partes[0]}.${partes[1]}.xxx.xxx`;
  return ip;
}

function contieneDatosSensibles(obj) {
  const str = JSON.stringify(obj);
  return /password|contrase\u00f1a|email|correo|dni|cedula|ssn/i.test(str);
}

async function registrarAuditoria(data, reintentos = 2) {
  setImmediate(async () => {
    try {
      // Validar datos sensibles
      if (contieneDatosSensibles(data.metadatos)) {
        console.warn('Intento de registrar datos sensibles en auditoría.');
        return;
      }
      // Enmascarar IP si es requerido
      data.ip = enmascararIP(data.ip);
      await Auditoria.create({ ...data, fecha_hora: new Date() });
    } catch (err) {
      if (reintentos > 0) {
        setTimeout(() => registrarAuditoria(data, reintentos - 1), 500);
      } else {
        console.error('Error registrando auditoría:', err);
      }
    }
  });
}

module.exports = registrarAuditoria;
