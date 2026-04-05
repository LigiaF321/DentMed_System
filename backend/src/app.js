require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

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
const adminConsultoriosRoutes = require("./routes/adminConsultorios.routes");
const horariosRoutes = require("./routes/horarios.routes");
const parametrosRoutes = require("./routes/parametros.routes");
const monitoringRoutes = require("./routes/monitoring.routes");
const restauracionRoutes = require("./routes/restauracion.routes");
const alertasInventarioRoutes = require("./routes/alertasInventario.routes");
const kardexRoutes = require("./routes/kardex.routes");
const reportesConsumoRoutes = require("./routes/reportesConsumo.routes");
const alertasSeguridadRoutes = require("./routes/alertasSeguridad.routes");
const materialesRoutes = require("./routes/materiales.routes");
const pacientesRoutes = require("./routes/pacientes.routes");
const tratamientosRoutes = require("./routes/tratamientos.routes");
const citasRoutes = require("./routes/citas.routes");
const consultoriosRoutes = require("./routes/consultorios.routes");
const documentosRoutes = require("./routes/documentos.routes");
const bloquesRoutes = require("./routes/bloques.routes");
const auditoriaRoutes = require("./routes/auditoria.routes");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminPanelRoutes);
app.use("/api/admin", adminDentistsRoutes);
app.use("/api/admin/consultorios", adminConsultoriosRoutes);
app.use("/api/admin/horarios", horariosRoutes);
app.use("/api/admin/parametros", parametrosRoutes);
app.use("/api/admin/monitoring", monitoringRoutes);
app.use("/api/admin/alertas", alertasInventarioRoutes);
app.use("/api/admin/seguridad", alertasSeguridadRoutes);
app.use("/api/admin/kardex", kardexRoutes);
app.use("/api/admin/materiales", materialesRoutes);
app.use("/api/admin/reportes", reportesConsumoRoutes);
app.use("/api/auditoria", auditoriaRoutes);

app.use("/api/restauracion", restauracionRoutes);
app.use("/api/dentistas", dentistaRoutes);
app.use("/api/pacientes", pacientesRoutes);
app.use("/api", tratamientosRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/consultorios", consultoriosRoutes);
app.use("/api", documentosRoutes);
app.use("/api/bloques", bloquesRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "API DentMed System funcionando",
    version: "1.0.0",
    endpoints: [
      "/api/dentistas",
      "/api/restauracion",
      "/api/admin/alertas",
      "/api/admin/seguridad",
      "/api/admin/kardex",
      "/api/admin/materiales",
      "/api/admin/reportes",
      "/api/bloques",
      "/api/auditoria",
      "/api/citas",
      "/api/consultorios",
      "/api/pacientes/:id/documentos",
      "/api/documentos/:id/descargar"
    ],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

module.exports = app;