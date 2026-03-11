const express = require("express");
const controller = require("../controllers/monitoring.controller");

const router = express.Router();

router.get("/overview", controller.getOverview);
router.get("/activities", controller.getActivities);
router.get("/users", controller.getUsuarios);
router.get("/session-times", controller.getSessionTimes);
router.get("/module-stats", controller.getModuleStats);
router.get("/recent-errors", controller.getRecentErrors);

module.exports = router;