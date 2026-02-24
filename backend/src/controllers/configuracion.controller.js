const { Op } = require("sequelize");
const { Configuracion, HistorialConfiguracion } = require("../models");

const DEFAULTS = {
  stock_minimo_global: {
    valor: "5",
    tipo_dato: "int",
    descripcion: "Umbral para alerta de inventario bajo",
  },
  dias_recordatorio_citas: {
    valor: "2",
    tipo_dato: "int",
    descripcion: "Días antes para recordatorio de cita (0 permitido)",
  },
  limite_intentos_fallidos_login: {
    valor: "3",
    tipo_dato: "int",
    descripcion: "Intentos fallidos antes de bloqueo temporal",
  },
};

const LABELS = {
  stock_minimo_global: "Stock mínimo",
  dias_recordatorio_citas: "Recordatorio",
  limite_intentos_fallidos_login: "Intentos fallidos",
};

function ipFromReq(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.ip;
}

function intStrict(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isSafeInteger(n)) return null;
  return n;
}

function validateRanges({ stock_minimo_global, dias_recordatorio_citas, limite_intentos_fallidos_login }) {
  if (stock_minimo_global === null || stock_minimo_global < 1 || stock_minimo_global > 9999) {
    return "Stock mínimo: entre 1 y 9999";
  }
  if (dias_recordatorio_citas === null || dias_recordatorio_citas < 0 || dias_recordatorio_citas > 30) {
    return "Días recordatorio: entre 0 y 30";
  }
  if (
    limite_intentos_fallidos_login === null ||
    limite_intentos_fallidos_login < 1 ||
    limite_intentos_fallidos_login > 10
  ) {
    return "Intentos fallidos: entre 1 y 10";
  }
  return null;
}

async function ensureDefaults() {
  const keys = Object.keys(DEFAULTS);
  for (const clave of keys) {
    const def = DEFAULTS[clave];
    await Configuracion.findOrCreate({
      where: { clave },
      defaults: {
        clave,
        valor: def.valor,
        tipo_dato: def.tipo_dato,
        descripcion: def.descripcion,
        activo: true,
        fecha_modificacion: new Date(),
      },
    });
  }
}

async function readConfigObject() {
  const keys = Object.keys(DEFAULTS);
  const rows = await Configuracion.findAll({ where: { clave: { [Op.in]: keys } } });
  const map = new Map(rows.map((r) => [r.clave, r]));

  const out = {};
  for (const k of keys) {
    const r = map.get(k);
    out[k] = r ? intStrict(r.valor) ?? Number(r.valor) : intStrict(DEFAULTS[k].valor);
  }
  return out;
}

async function getConfiguracion(req, res) {
  try {
    await ensureDefaults();
    const cfg = await readConfigObject();
    return res.json(cfg);
  } catch (err) {
    console.error("getConfiguracion error:", err);
    return res.status(500).json({ message: "Error obteniendo configuración" });
  }
}

async function putConfiguracion(req, res) {
  try {
    await ensureDefaults();

    const stock_minimo_global = intStrict(req.body.stock_minimo_global);
    const dias_recordatorio_citas = intStrict(req.body.dias_recordatorio_citas);
    const limite_intentos_fallidos_login = intStrict(req.body.limite_intentos_fallidos_login);

    const msg = validateRanges({ stock_minimo_global, dias_recordatorio_citas, limite_intentos_fallidos_login });
    if (msg) return res.status(400).json({ message: msg });

    const userId = req.user?.id || req.user?.user_id || req.user?.usuario_id || null;
    const userName = req.user?.username || req.user?.email || req.user?.nombre || "Admin";
    const ip = ipFromReq(req);

    const current = await readConfigObject();
    const updates = {
      stock_minimo_global,
      dias_recordatorio_citas,
      limite_intentos_fallidos_login,
    };

    const changed = [];
    for (const k of Object.keys(updates)) {
      if (Number(current[k]) !== Number(updates[k])) changed.push(k);
    }

    for (const clave of Object.keys(updates)) {
      const row = await Configuracion.findOne({ where: { clave } });
      await row.update({
        valor: String(updates[clave]),
        modificado_por: userId,
        fecha_modificacion: new Date(),
      });
    }

    for (const clave of changed) {
      await HistorialConfiguracion.create({
        usuario_id: userId,
        usuario_nombre: userName,
        cambio: `${LABELS[clave]}: ${current[clave]} → ${updates[clave]}`,
        valor_anterior: String(current[clave]),
        valor_nuevo: String(updates[clave]),
        ip,
        fecha: new Date(),
      });
    }

    const cfg = await readConfigObject();
    return res.json({ message: "Configuración actualizada", config: cfg, changed });
  } catch (err) {
    console.error("putConfiguracion error:", err);
    return res.status(500).json({ message: "Error actualizando configuración" });
  }
}

async function resetConfiguracion(req, res) {
  try {
    await ensureDefaults();

    const userId = req.user?.id || req.user?.user_id || req.user?.usuario_id || null;
    const userName = req.user?.username || req.user?.email || req.user?.nombre || "Admin";
    const ip = ipFromReq(req);

    const current = await readConfigObject();

    for (const clave of Object.keys(DEFAULTS)) {
      const row = await Configuracion.findOne({ where: { clave } });
      await row.update({
        valor: DEFAULTS[clave].valor,
        modificado_por: userId,
        fecha_modificacion: new Date(),
      });

      if (String(current[clave]) !== String(DEFAULTS[clave].valor)) {
        await HistorialConfiguracion.create({
          usuario_id: userId,
          usuario_nombre: userName,
          cambio: `${LABELS[clave]}: ${current[clave]} → ${DEFAULTS[clave].valor}`,
          valor_anterior: String(current[clave]),
          valor_nuevo: String(DEFAULTS[clave].valor),
          ip,
          fecha: new Date(),
        });
      }
    }

    const cfg = await readConfigObject();
    return res.json({ message: "Restablecido a valores por defecto", config: cfg });
  } catch (err) {
    console.error("resetConfiguracion error:", err);
    return res.status(500).json({ message: "Error restableciendo configuración" });
  }
}

async function getHistorial(req, res) {
  try {
    const pagina = Math.max(1, intStrict(req.query.pagina) || 1);
    const limite = Math.min(100, Math.max(1, intStrict(req.query.limite) || 10));
    const offset = (pagina - 1) * limite;

    const usuario = String(req.query.usuario || "").trim();
    const desde = String(req.query.desde || "").trim();
    const hasta = String(req.query.hasta || "").trim();

    const where = {};
    if (usuario) where.usuario_nombre = { [Op.like]: `%${usuario}%` };

    if (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)) {
      where.fecha = where.fecha || {};
      where.fecha[Op.gte] = new Date(`${desde}T00:00:00`);
    }
    if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      where.fecha = where.fecha || {};
      where.fecha[Op.lte] = new Date(`${hasta}T23:59:59`);
    }

    const { count, rows } = await HistorialConfiguracion.findAndCountAll({
      where,
      order: [["fecha", "DESC"]],
      limit: limite,
      offset,
    });

    return res.json({
      pagina,
      limite,
      total: count,
      registros: rows,
    });
  } catch (err) {
    console.error("getHistorial error:", err);
    return res.status(500).json({ message: "Error obteniendo historial" });
  }
}

module.exports = { getConfiguracion, putConfiguracion, resetConfiguracion, getHistorial };