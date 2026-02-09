// app.js - Configuración principal de Express
const express = require("express");
const app = express();

// 1. IMPORTANTE: Importar las rutas que creaste
const dentistaRoutes = require('./routes/dentistaRoutes');

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. IMPORTANTE: Conectar la ruta con el prefijo /api/dentistas
app.use('/api/dentistas', dentistaRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        message: "API DentMed System funcionando",
        version: "1.0.0",
        // Actualicé la lista aquí también para tu control
        endpoints: ["/api/pacientes", "/api/dentistas", "/api/citas"]
    });
});

// Ruta de salud
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;