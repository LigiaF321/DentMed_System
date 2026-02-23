// app.js - Configuración principal de Express
const express = require("express");
const cors = require("cors");
const app = express();

// 1. IMPORTACIÓN DE RUTAS
const authRoutes = require("./routes/auth.routes");
const dentistaRoutes = require("./routes/dentistaRoutes");
const medicoRoutes = require("./routes/medico.routes");
const adminRoutes = require("./routes/adminDentists.routes"); // <--- AGREGADO PARA CALIDAD

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CONEXIÓN DE RUTAS
app.use("/api/auth", authRoutes);
app.use("/api/dentistas", dentistaRoutes);
app.use("/api/medico", medicoRoutes);
app.use("/api/admin", adminRoutes); // <--- AGREGADO PARA CALIDAD

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        message: "API DentMed System funcionando",
        version: "1.0.0",
        endpoints: ["/api/auth", "/api/dentistas", "/api/medico", "/api/admin"]
    });
});

// Ruta de salud
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;