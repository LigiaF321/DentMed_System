const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { listarConsultorios } = require("../controllers/consultorios.controller");

router.get("/", verifyToken, listarConsultorios);

module.exports = router;