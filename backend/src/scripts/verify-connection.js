/**
 * Script para verificar conexión a MySQL (XAMPP)
 * Uso: npm run db:verify
 * Requiere: XAMPP con MySQL iniciado y base de datos dentmed_db creada en phpMyAdmin
 */
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env") });
const sequelize = require("../config/database");

async function verifyConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a MySQL (XAMPP) exitosa.");
    console.log("   Base de datos:", process.env.DB_NAME || "dentmed_db");
    console.log("   Host:", process.env.DB_HOST || "localhost");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error al conectar con MySQL:", err.message);
    console.error("\nVerifica que:");
    console.error("  1. XAMPP esté iniciado (Apache y MySQL en verde)");
    console.error("  2. En phpMyAdmin exista la base de datos dentmed_db");
    console.error("  3. El archivo .env tenga DB_USER y DB_PASSWORD correctos (XAMPP: root / vacío)");
    process.exit(1);
  }
}

verifyConnection();
