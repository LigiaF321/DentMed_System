const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const { DocumentoPaciente, Paciente } = require("../models");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo se permiten JPG, PNG, WEBP y PDF."));
  }
};

const uploadDocumento = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const asegurarDirectorio = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const obtenerExtensionDesdeMime = (mimeType) => {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "";
  }
};

const detectarTipoDocumento = (
  nombreOriginal = "",
  mimeType = "",
  tipoManual = ""
) => {
  if (tipoManual) return tipoManual;

  const nombre = String(nombreOriginal).toLowerCase();

  if (
    nombre.includes("rx") ||
    nombre.includes("radiografia") ||
    nombre.includes("radiografía") ||
    mimeType.startsWith("image/")
  ) {
    return "radiografia";
  }

  if (nombre.includes("presupuesto") || nombre.includes("cotizacion") || nombre.includes("cotización")) {
    return "presupuesto";
  }

  if (
    nombre.includes("consentimiento") ||
    nombre.includes("autorizacion") ||
    nombre.includes("autorización")
  ) {
    return "consentimiento";
  }

  return "otro";
};

const procesarImagen = async (buffer, mimeType) => {
  if (mimeType === "image/png") {
    const outputBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: 2200, withoutEnlargement: true })
      .png({ compressionLevel: 8 })
      .toBuffer();

    return {
      buffer: outputBuffer,
      extension: "png",
      mimeType: "image/png",
    };
  }

  if (mimeType === "image/webp") {
    const outputBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: 2200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      buffer: outputBuffer,
      extension: "webp",
      mimeType: "image/webp",
    };
  }

  const outputBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 2200, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return {
    buffer: outputBuffer,
    extension: "jpg",
    mimeType: "image/jpeg",
  };
};

const normalizarEtiquetas = (etiquetas) => {
  try {
    const parsed = Array.isArray(etiquetas)
      ? etiquetas
      : JSON.parse(etiquetas || "[]");

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((tag) => String(tag || "").trim())
      .filter(Boolean);
  } catch (error) {
    return [];
  }
};

const subirDocumentoPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_documento = "", etiquetas = "[]" } = req.body;

    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      return res.status(404).json({
        ok: false,
        message: "Paciente no encontrado",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "Debes adjuntar un archivo",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado",
      });
    }

    const uploadDir = path.join(__dirname, "../../uploads/documentos");
    asegurarDirectorio(uploadDir);

    const mimeTypeOriginal = req.file.mimetype;
    const nombreOriginal = req.file.originalname;

    let bufferFinal = req.file.buffer;
    let mimeTypeFinal = mimeTypeOriginal;
    let extensionFinal =
      path.extname(nombreOriginal).replace(".", "").toLowerCase() ||
      obtenerExtensionDesdeMime(mimeTypeOriginal);

    if (mimeTypeOriginal.startsWith("image/")) {
      const imagenProcesada = await procesarImagen(req.file.buffer, mimeTypeOriginal);
      bufferFinal = imagenProcesada.buffer;
      mimeTypeFinal = imagenProcesada.mimeType;
      extensionFinal = imagenProcesada.extension;
    }

    const nombreArchivo = `${uuidv4()}.${extensionFinal}`;
    const rutaFisica = path.join(uploadDir, nombreArchivo);

    fs.writeFileSync(rutaFisica, bufferFinal);

    const etiquetasParseadas = normalizarEtiquetas(etiquetas);

const tipoDetectado = String(
  detectarTipoDocumento(nombreOriginal, mimeTypeFinal, tipo_documento)
)
  .trim()
  .toLowerCase();
    

    const documento = await DocumentoPaciente.create({
      id_paciente: Number(id),
      id_usuario_subio: req.user.id,
      nombre_original: nombreOriginal,
      nombre_archivo: nombreArchivo,
      ruta_archivo: `/uploads/documentos/${nombreArchivo}`,
      mime_type: mimeTypeFinal,
      extension: extensionFinal,
      tamano_bytes: bufferFinal.length,
      tipo_documento: tipoDetectado,
      etiquetas: JSON.stringify(etiquetasParseadas),
      miniatura_url: mimeTypeFinal.startsWith("image/")
        ? `/uploads/documentos/${nombreArchivo}`
        : null,
      activo: true,
    });

    return res.status(201).json({
      ok: true,
      message: "Documento subido correctamente",
      data: {
        ...documento.toJSON(),
        etiquetas: etiquetasParseadas,
        url: documento.ruta_archivo,
      },
    });
  } catch (error) {
    console.error("Error en subirDocumentoPaciente:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al subir documento",
      error: error.message,
    });
  }
};

const listarDocumentosPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo = "", q = "" } = req.query;

    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      return res.status(404).json({
        ok: false,
        message: "Paciente no encontrado",
      });
    }

    const documentos = await DocumentoPaciente.findAll({
      where: {
        id_paciente: Number(id),
        activo: true,
      },
      order: [["created_at", "DESC"]],
    });

    let resultado = documentos.map((doc) => {
      const etiquetas = normalizarEtiquetas(doc.etiquetas || "[]");

      const puedeEliminar =
        req.user?.rol === "admin" ||
        Number(req.user?.id) === Number(doc.id_usuario_subio);

      return {
        ...doc.toJSON(),
        etiquetas,
        url: doc.ruta_archivo,
        puedeEliminar,
      };
    });

    if (tipo) {
      resultado = resultado.filter((doc) => doc.tipo_documento === tipo);
    }

    if (q) {
      const texto = String(q).toLowerCase().trim();

      resultado = resultado.filter((doc) => {
        const nombre = String(doc.nombre_original || "").toLowerCase();
        const tipoDoc = String(doc.tipo_documento || "").toLowerCase();
        const etiquetasTexto = (doc.etiquetas || []).join(" ").toLowerCase();

        return (
          nombre.includes(texto) ||
          tipoDoc.includes(texto) ||
          etiquetasTexto.includes(texto)
        );
      });
    }

    return res.json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Error en listarDocumentosPaciente:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar documentos",
      error: error.message,
    });
  }
};

const eliminarDocumento = async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await DocumentoPaciente.findByPk(id);
    if (!documento || !documento.activo) {
      return res.status(404).json({
        ok: false,
        message: "Documento no encontrado",
      });
    }

    const esAdmin = req.user?.rol === "admin";
    const usuarioId = req.user?.id;
    const esPropietario = Number(usuarioId) === Number(documento.id_usuario_subio);

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({
        ok: false,
        message: "No tienes permisos para eliminar este documento",
      });
    }

    const rutaRelativa = String(documento.ruta_archivo || "").replace(/^\/+/, "");
    const rutaFisica = path.join(__dirname, "../../", rutaRelativa);

    if (fs.existsSync(rutaFisica)) {
      fs.unlinkSync(rutaFisica);
    }

    documento.activo = false;
    await documento.save();

    return res.json({
      ok: true,
      message: "Documento eliminado correctamente",
    });
  } catch (error) {
    console.error("Error en eliminarDocumento:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar documento",
      error: error.message,
    });
  }
};

const descargarDocumento = async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await DocumentoPaciente.findByPk(id);
    if (!documento || !documento.activo) {
      return res.status(404).json({
        ok: false,
        message: "Documento no encontrado",
      });
    }

    const rutaRelativa = String(documento.ruta_archivo || "").replace(/^\/+/, "");
    const rutaFisica = path.join(__dirname, "../../", rutaRelativa);

    if (!fs.existsSync(rutaFisica)) {
      return res.status(404).json({
        ok: false,
        message: "El archivo no existe en el servidor",
      });
    }

    return res.download(rutaFisica, documento.nombre_original);
  } catch (error) {
    console.error("Error en descargarDocumento:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al descargar documento",
      error: error.message,
    });
  }
};

module.exports = {
  uploadDocumento,
  subirDocumentoPaciente,
  listarDocumentosPaciente,
  eliminarDocumento,
  descargarDocumento,
};