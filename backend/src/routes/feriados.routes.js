const express = require("express");
const router = express.Router();

// GET /api/feriados
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Feriados obtenidos correctamente",
    data: [],
  });
});

module.exports = router;
