// app.js - Configuración principal de Express
const express = require("express");
const app = express();

const horariosRoutes = require("./routes/horarios.routes");

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/horarios", horariosRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        message: "API DentMed System funcionando",
        version: "1.0.0",
        endpoints: ["/api/pacientes", "/api/doctores", "/api/citas"]
    });
});

// Ruta de salud
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;
