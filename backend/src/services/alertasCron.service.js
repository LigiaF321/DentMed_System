const cron = require("node-cron");
const alertasService = require("./alertasInventario.service");
const { enviarReporteAlertas } = require("./alertasNotificacion.service");

let tareaCalculoDiario = null;
let tareaReporteSemanal = null;

function convertirDiaSistemaACron(dia) {
  // sistema: 1=Lunes ... 7=Domingo
  // cron: 0 o 7=Domingo, 1=Lunes ... 6=Sábado
  if (Number(dia) === 7) return 0;
  return Number(dia);
}

function parsearHora(hora = "08:00:00") {
  const [hh = "8", mm = "0"] = hora.split(":");
  return {
    hora: Number(hh),
    minuto: Number(mm),
  };
}

async function reprogramarCronSemanalAlertas() {
  if (tareaReporteSemanal) {
    tareaReporteSemanal.stop();
    tareaReporteSemanal.destroy();
    tareaReporteSemanal = null;
  }

  const config = await alertasService.obtenerConfiguracionActual();

  if (!config?.notificaciones_activas) {
    console.log("ℹ️ Notificaciones semanales de alertas desactivadas.");
    return;
  }

  const diaCron = convertirDiaSistemaACron(config.dia_envio);
  const { hora, minuto } = parsearHora(config.hora_envio);

  const expresion = `${minuto} ${hora} * * ${diaCron}`;

  tareaReporteSemanal = cron.schedule(expresion, async () => {
    try {
      console.log("📧 Ejecutando reporte semanal de alertas...");
      await enviarReporteAlertas({ manual: false });
    } catch (error) {
      console.error("❌ Error en reporte semanal:", error.message);
    }
  });

  console.log(`✅ Cron semanal de alertas programado: ${expresion}`);
}

async function iniciarCronAlertas() {
  if (!tareaCalculoDiario) {
    // Diario a las 6:00 AM
    tareaCalculoDiario = cron.schedule("0 6 * * *", async () => {
      try {
        console.log("🕕 Ejecutando cálculo diario de alertas...");
        await alertasService.ejecutarCalculoAlertas();
      } catch (error) {
        console.error("❌ Error en cálculo diario de alertas:", error.message);
      }
    });

    console.log("✅ Cron diario de alertas programado: 0 6 * * *");
  }

  await reprogramarCronSemanalAlertas();
}

module.exports = {
  iniciarCronAlertas,
  reprogramarCronSemanalAlertas,
};