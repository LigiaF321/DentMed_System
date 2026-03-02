const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth.controller");


router.post("/forgot-password", auth.forgotPassword);
router.post("/verify-code", auth.verifyCode);
router.post("/reset-password", auth.resetPassword);


router.get("/dentistas/validar-email", auth.validarEmail);
router.post("/dentistas", auth.crearDentista);
router.post("/login", auth.login);
router.post("/force-change-password", auth.forceChangePassword);
router.get("/medico/dashboard", auth.getMedicoDashboard);

module.exports = router;