const express = require("express");
const router = express.Router();

const {
  getActivities,
  getSecurityAlerts,
  getHourlyStats,
  getSessionTimes,
  getUsuarios,
} = require("../controllers/monitoring.controller");

// Rutas de monitoreo
router.get("/activities", getActivities);
router.get("/security-alerts", getSecurityAlerts);
router.get("/hourly-stats", getHourlyStats);
router.get("/session-times", getSessionTimes);
router.get("/usuarios", getUsuarios);

module.exports = router;
