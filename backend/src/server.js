// server.js - Punto de entrada del servidor
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Servidor DentMed ejecutándose en el puerto " + PORT);
    console.log("📡 Health check: http://localhost:" + PORT + "/health");
});
