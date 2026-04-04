const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const {
  uploadDocumento,
  subirDocumentoPaciente,
  listarDocumentosPaciente,
  eliminarDocumento,
  descargarDocumento,
} = require("../controllers/documentos.controller");

router.post(
  "/pacientes/:id/documentos",
  verifyToken,
  uploadDocumento.single("archivo"),
  subirDocumentoPaciente
);

router.get(
  "/pacientes/:id/documentos",
  verifyToken,
  listarDocumentosPaciente
);

router.delete(
  "/documentos/:id",
  verifyToken,
  eliminarDocumento
);

router.get(
  "/documentos/:id/descargar",
  verifyToken,
  descargarDocumento
);

module.exports = router;