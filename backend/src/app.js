// app.js - Configuración principal de Express
require("dotenv").config(); 
const express = require("express");
const app = express();
const cors = require("cors");

// Configuración específica de CORS para permitir frontend
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// 1. IMPORTACIONES
const dentistaRoutes = require('./routes/dentistaRoutes');
const authRoutes = require("./routes/auth.routes");
const adminPanelRoutes = require("./routes/adminPanel.routes");
const adminDentistsRoutes = require("./routes/adminDentists.routes");
const horariosRoutes = require("./routes/horarios.routes");
const parametrosRoutes = require("./routes/parametros.routes");
const monitoringRoutes = require("./routes/monitoring.routes");
// --- TU NUEVA RUTA AQUÍ ---
const restauracionRoutes = require("./routes/restauracion.routes");

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. REGISTRO DE RUTAS
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminPanelRoutes);
app.use("/api/admin", adminDentistsRoutes);
app.use("/api/admin/horarios", horariosRoutes);
app.use("/api/admin/parametros", parametrosRoutes);
app.use("/api/admin/monitoring", monitoringRoutes);

// --- TU PUNTO DE ACCESO AQUÍ ---
app.use("/api/restauracion", restauracionRoutes); 

// Rutas de otros módulos
app.use('/api/dentistas', dentistaRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        message: "API DentMed System funcionando",
        version: "1.0.0",
        endpoints: ["/api/pacientes", "/api/dentistas", "/api/citas", "/api/restauracion"]
    });
});

// Ruta de salud
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;