const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth.controller");

router.post("/forgot-password", auth.forgotPassword);
router.post("/verify-code", auth.verifyCode);
router.post("/reset-password", auth.resetPassword);

module.exports = router;