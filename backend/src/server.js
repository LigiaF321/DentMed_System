const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
const app = require("./app");
const { iniciarCronAlertas } = require("./services/alertasCron.service");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log("🚀 Servidor DentMed ejecutándose en el puerto " + PORT);
  console.log("📡 Health check: http://localhost:" + PORT + "/health");

  try {
    await iniciarCronAlertas();
    console.log("⏰ Cron de alertas iniciado correctamente");
  } catch (error) {
    console.error("❌ No se pudo iniciar el cron de alertas:", error.message);
  }
});