// server.js - Punto de entrada del servidor
const path = require("path");
const dotenv = require("dotenv");

/**
 * IMPORTANTE: Cargamos las variables de entorno al inicio.
 * Usamos __dirname para asegurar que encuentre el archivo .env 
 * que moviste a la carpeta 'backend'.
 */
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = require("./app");

// Usamos el puerto del .env o el 3000 por defecto
const PORT = process.env.PORT || 3000;

/**
 * Verificación técnica en consola
 * Esto confirma que las Tareas 151 y 166 (Tokens) tienen su clave secreta.
 */
console.log("---------------------------------------");
console.log("🔐 Verificando Configuración:");
console.log("JWT_SECRET cargado:", process.env.JWT_SECRET ? "✅ SÍ" : "❌ NO");
console.log("Base de Datos:", process.env.DB_NAME || "No configurada");
console.log("---------------------------------------");

// Arrancamos el servidor
app.listen(PORT, () => {
    console.log("🚀 Servidor DentMed ejecutándose en el puerto " + PORT);
    console.log("📡 Health check: http://localhost:" + PORT + "/health");
});