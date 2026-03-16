const alertasSeguridadService = require("../services/alertasSeguridad.service");
const emailService = require("../services/email.service");

async function ejecutarTareasProgramadas() {
  try {
    console.log("Ejecutando tareas programadas de alertas de seguridad...");

    // Reactivar alertas silenciadas expiradas
    const reactivadas = await alertasSeguridadService.reactivarAlertasExpiradas();
    console.log(`Alertas reactivadas: ${reactivadas}`);

    // Generar reporte semanal (solo los lunes)
    const hoy = new Date();
    if (hoy.getDay() === 1 && hoy.getHours() === 8) { // Lunes a las 8 AM
      const reporte = await alertasSeguridadService.generarReporteSemanal();
      console.log("Reporte semanal generado:", reporte);

      // Enviar por email (implementar cuando emailService esté listo)
      // await emailService.enviarReporteSemanal(reporte);
    }

    console.log("Tareas programadas completadas.");
  } catch (error) {
    console.error("Error en tareas programadas:", error);
  }
}

// Ejecutar cada hora
setInterval(ejecutarTareasProgramadas, 60 * 60 * 1000); // 1 hora

// Ejecutar inmediatamente para testing
if (require.main === module) {
  ejecutarTareasProgramadas();
}

module.exports = { ejecutarTareasProgramadas };