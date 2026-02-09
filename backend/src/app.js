// app.js - Configuración principal de Express
const express = require("express");
const app = express();

// Importación de rutas
const horariosRoutes = require("./routes/horarios.routes");
const feriadosRoutes = require("./routes/feriados.routes");

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas del sistema
app.use("/api/horarios", horariosRoutes);
app.use("/api/feriados", feriadosRoutes);

// Ruta raíz (informativa)
app.get("/", (req, res) => {
  res.json({
    message: "API DentMed System funcionando",
    version: "1.0.0",
    endpoints: [
      "/api/horarios",
      "/api/feriados",
      "/health"
    ],
  });
});

// Ruta de salud
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
  });
});

module.exports = app;
