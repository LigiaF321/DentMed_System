/**
 * Sincroniza modelos con la base de datos (crea tablas si no existen)
 * Uso: npm run db:sync
 * Requiere: MySQL (XAMPP) corriendo y dentmed_db creada en phpMyAdmin
 */
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env") });
const { sequelize } = require("../models");

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión OK. Sincronizando tablas...");

    // alter: true agrega nuevas columnas a tablas existentes (apellidos, licencia, ip)
    await sequelize.sync({ alter: true, force: false });
    console.log("✅ Tablas creadas/actualizadas correctamente.");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

syncDatabase();
