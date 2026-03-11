require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

const dentistaRoutes = require("./routes/dentistaRoutes");
const authRoutes = require("./routes/auth.routes");
const adminPanelRoutes = require("./routes/adminPanel.routes");
const adminDentistsRoutes = require("./routes/adminDentists.routes");
const horariosRoutes = require("./routes/horarios.routes");
const parametrosRoutes = require("./routes/parametros.routes");
const monitoringRoutes = require("./routes/monitoring.routes");
const restauracionRoutes = require("./routes/restauracion.routes");
const alertasInventarioRoutes = require("./routes/alertasInventario.routes");
const kardexRoutes = require("./routes/kardex.routes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminPanelRoutes);
app.use("/api/admin", adminDentistsRoutes);
app.use("/api/admin/horarios", horariosRoutes);
app.use("/api/admin/parametros", parametrosRoutes);
app.use("/api/admin/monitoring", monitoringRoutes);
app.use("/api/admin/alertas", alertasInventarioRoutes);
app.use("/api/admin/kardex", kardexRoutes);

app.use("/api/restauracion", restauracionRoutes);
app.use("/api/dentistas", dentistaRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "API DentMed System funcionando",
    version: "1.0.0",
    endpoints: [
      "/api/dentistas",
      "/api/restauracion",
      "/api/admin/alertas",
      "/api/admin/kardex",
    ],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;