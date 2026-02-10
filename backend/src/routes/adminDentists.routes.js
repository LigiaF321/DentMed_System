const express = require("express");
const router = express.Router();

const {
  createDentistAccount,
} = require("../controllers/adminDentists.controller");


router.post("/dentistas", createDentistAccount);

module.exports = router;
