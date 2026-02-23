const { Op } = require("sequelize");
const { HorarioClinica } = require("../models");

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function toBool(v, def = true) {
  if (v === undefined || v === null) return def;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v).toLowerCase().trim();
  if (s === "true" || s === "1" || s === "si" || s === "sí") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return def;
}

function isValidTime(t) {
  return typeof t === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(t);
}

function normalizeTime(t, fallback = "00:00:00") {
  if (!t) return fallback;
  if (!isValidTime(t)) return fallback;
  return t.length === 5 ? `${t}:00` : t;
}

function isValidISODate(d) {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

async function ensureWeeklyDefaults() {
  for (const dia of DIAS) {
    const isDomingo = dia === "Domingo";
    const isSabado = dia === "Sábado";

    const defaults = {
      tipo: "SEMANAL",
      dia_semana: dia,
      fecha: null,
      hora_inicio: isDomingo ? "00:00:00" : "08:00:00",
      hora_fin: isDomingo ? "00:00:00" : isSabado ? "12:00:00" : "17:00:00",
      activo: isDomingo ? false : true,
      descripcion: isDomingo
        ? "Cerrado"
        : isSabado
        ? "Horario regular sábado"
        : "Horario regular",
    };

    await HorarioClinica.findOrCreate({
      where: { tipo: "SEMANAL", dia_semana: dia },
      defaults,
    });
  }
}

async function getHorarios(req, res) {
  try {
    await ensureWeeklyDefaults();

    const semanal = await HorarioClinica.findAll({
      where: { tipo: "SEMANAL" },
      order: [["id", "ASC"]],
    });

    const excepciones = await HorarioClinica.findAll({
      where: { tipo: "EXCEPCION" },
      order: [["fecha", "ASC"]],
    });

    return res.json({ semanal, excepciones });
  } catch (err) {
    console.error("getHorarios error:", err);
    return res.status(500).json({ message: "Error obteniendo horarios" });
  }
}

async function upsertHorarioSemanal(req, res) {
  try {
    const { dia_semana, hora_inicio, hora_fin, activo, descripcion } = req.body;

    if (!dia_semana || !DIAS.includes(dia_semana)) {
      return res.status(400).json({ message: "Día inválido" });
    }

    if (hora_inicio && !isValidTime(hora_inicio)) {
      return res.status(400).json({ message: "hora_inicio inválida (HH:MM o HH:MM:SS)" });
    }

    if (hora_fin && !isValidTime(hora_fin)) {
      return res.status(400).json({ message: "hora_fin inválida (HH:MM o HH:MM:SS)" });
    }

    const [row] = await HorarioClinica.findOrCreate({
      where: { tipo: "SEMANAL", dia_semana },
      defaults: {
        tipo: "SEMANAL",
        dia_semana,
        fecha: null,
        hora_inicio: normalizeTime(hora_inicio, "08:00:00"),
        hora_fin: normalizeTime(hora_fin, "12:00:00"),
        activo: toBool(activo, true),
        descripcion: descripcion ?? null,
      },
    });

    await row.update({
      hora_inicio: hora_inicio ? normalizeTime(hora_inicio, row.hora_inicio) : row.hora_inicio,
      hora_fin: hora_fin ? normalizeTime(hora_fin, row.hora_fin) : row.hora_fin,
      activo: toBool(activo, row.activo),
      descripcion: descripcion ?? row.descripcion,
    });

    return res.json({ message: "Horario semanal guardado", horario: row });
  } catch (err) {
    console.error("upsertHorarioSemanal error:", err);
    return res.status(500).json({ message: "Error guardando horario semanal" });
  }
}

async function createExcepcion(req, res) {
  try {
    const { fecha, hora_inicio, hora_fin, activo, descripcion } = req.body;

    if (!fecha || !isValidISODate(fecha)) {
      return res.status(400).json({ message: "fecha inválida (YYYY-MM-DD)" });
    }

    const activoBool = toBool(activo, true);

    const inicio = hora_inicio ? (String(hora_inicio).length === 5 ? `${hora_inicio}:00` : String(hora_inicio)) : null;
    const fin = hora_fin ? (String(hora_fin).length === 5 ? `${hora_fin}:00` : String(hora_fin)) : null;

    if (activoBool) {
      if (!inicio || !isValidTime(inicio)) {
        return res.status(400).json({ message: "hora_inicio requerida (HH:MM o HH:MM:SS)" });
      }
      if (!fin || !isValidTime(fin)) {
        return res.status(400).json({ message: "hora_fin requerida (HH:MM o HH:MM:SS)" });
      }
    }

    const safeInicio = activoBool ? inicio : "00:00:00";
    const safeFin = activoBool ? fin : "00:00:00";

    const existing = await HorarioClinica.findOne({
      where: { tipo: "EXCEPCION", fecha: { [Op.eq]: fecha } },
    });

    if (existing) {
      await existing.update({
        dia_semana: null,
        hora_inicio: safeInicio,
        hora_fin: safeFin,
        activo: activoBool,
        descripcion: descripcion ?? existing.descripcion ?? null,
      });
      return res.json({ message: "Excepción actualizada", excepcion: existing });
    }

    const created = await HorarioClinica.create({
      tipo: "EXCEPCION",
      dia_semana: null,
      fecha,
      hora_inicio: safeInicio,
      hora_fin: safeFin,
      activo: activoBool,
      descripcion: descripcion ?? null,
    });

    return res.json({ message: "Excepción creada", excepcion: created });
  } catch (err) {
    console.error("createExcepcion error:", err);
    return res.status(500).json({ message: "Error creando excepción" });
  }
}

async function deleteExcepcion(req, res) {
  try {
    const { id } = req.params;

    const row = await HorarioClinica.findOne({ where: { id, tipo: "EXCEPCION" } });
    if (!row) return res.status(404).json({ message: "Excepción no encontrada" });

    await row.destroy();
    return res.json({ message: "Excepción eliminada" });
  } catch (err) {
    console.error("deleteExcepcion error:", err);
    return res.status(500).json({ message: "Error eliminando excepción" });
  }
}

module.exports = { getHorarios, upsertHorarioSemanal, createExcepcion, deleteExcepcion };