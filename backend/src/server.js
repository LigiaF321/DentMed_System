// server.js - Punto de entrada del servidor
const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Servidor DentMed ejecutándose en el puerto " + PORT);
    console.log("📡 Health check: http://localhost:" + PORT + "/health");
});
