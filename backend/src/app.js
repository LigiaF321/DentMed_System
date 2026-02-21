// app.js - Configuración principal de Express
const express = require("express");
const cors = require("cors");
const app = express();

const dentistaRoutes = require("./routes/dentistaRoutes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/adminDentists.routes");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/dentistas", dentistaRoutes);
app.use("/api/admin", adminRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        message: "API DentMed System funcionando",
        version: "1.0.0",
        // Actualicé la lista aquí también para tu control
        endpoints: ["/api/auth", "/api/dentistas", "/api/admin/dentistas"]
    });
});

// Ruta de salud
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;