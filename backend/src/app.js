// app.js - Configuración principal de Express
const express = require("express");
const app = express();

// 1. IMPORTANTE: Importar las rutas de dentistas
const dentistaRoutes = require('./routes/dentistaRoutes');

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. IMPORTANTE: Conectar la ruta de dentistas
app.use('/api/dentistas', dentistaRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        message: "API DentMed System funcionando",
        version: "1.0.0",
        endpoints: ["/api/pacientes", "/api/dentistas", "/api/citas"]
    });
});

// Ruta de salud
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;