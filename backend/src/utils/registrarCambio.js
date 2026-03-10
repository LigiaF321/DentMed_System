const AuditoriaCambios = require('../models/AuditoriaCambios');

async function registrarCambio(data, reintentos = 2) {
  setImmediate(async () => {
    try {
      await AuditoriaCambios.create({ ...data });
    } catch (err) {
      if (reintentos > 0) {
        setTimeout(() => registrarCambio(data, reintentos - 1), 500);
      } else {
        console.error('Error registrando cambio auditoría:', err);
      }
    }
  });
}

module.exports = registrarCambio;
