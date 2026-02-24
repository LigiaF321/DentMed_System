const { Op } = require("sequelize");
const { Configuracion, HistorialConfiguracion } = require("../models");

const DB_KEYS = {
  stock_minimo: "stock_minimo_global",
  dias_recordatorio: "dias_recordatorio_citas",
  intentos_fallidos: "limite_intentos_fallidos_login",
};

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
  stock_minimo: "Stock mínimo",
  dias_recordatorio: "Recordatorio",
  intentos_fallidos: "Intentos fallidos",
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

function validateRanges({ stock_minimo, dias_recordatorio, intentos_fallidos }) {
  if (stock_minimo === null || stock_minimo < 1 || stock_minimo > 9999) {
    return "Stock mínimo: entre 1 y 9999";
  }
  if (dias_recordatorio === null || dias_recordatorio < 0 || dias_recordatorio > 30) {
    return "Días recordatorio: entre 0 y 30";
  }
  if (intentos_fallidos === null || intentos_fallidos < 1 || intentos_fallidos > 10) {
    return "Intentos fallidos: entre 1 y 10";
  }
  return null;
}

function getRoleFromReq(req) {
  const r =
    req.user?.role ??
    req.user?.rol ??
    req.headers["x-user-role"] ??
    req.query.role ??
    "";
  return String(r).toLowerCase().trim();
}

function requireAdmin(req, res) {
  const role = getRoleFromReq(req);
  const ok = role === "admin" || role === "administrador";
  if (!ok) {
    res.status(403).json({ message: "Forbidden: solo administradores" });
    return false;
  }
  return true;
}

function getUserIdFromReq(req) {
  return (
    req.user?.id ??
    req.user?.user_id ??
    req.user?.usuario_id ??
    req.headers["x-user-id"] ??
    null
  );
}

function getUserLabelFromReq(req) {
  return (
    req.user?.username ??
    req.user?.email ??
    req.user?.nombre ??
    req.headers["x-user-label"] ??
    req.query.user ??
    "Admin"
  );
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

async function upsertValue(clave, value, userId) {
  const row = await Configuracion.findOne({ where: { clave } });
  if (row) {
    await row.update({
      valor: String(value),
      modificado_por: userId,
      fecha_modificacion: new Date(),
    });
  } else {
    await Configuracion.create({
      clave,
      valor: String(value),
      tipo_dato: DEFAULTS[clave]?.tipo_dato || "int",
      descripcion: DEFAULTS[clave]?.descripcion || "",
      activo: true,
      modificado_por: userId,
      fecha_modificacion: new Date(),
    });
  }
}

/** Lee desde DB_KEYS y devuelve formato simple para el frontend */
async function readParamsObject() {
  const dbKeys = Object.values(DB_KEYS);
  const rows = await Configuracion.findAll({ where: { clave: { [Op.in]: dbKeys } } });
  const map = new Map(rows.map((r) => [r.clave, r]));

  const out = {};
  for (const uiKey of Object.keys(DB_KEYS)) {
    const dbKey = DB_KEYS[uiKey];
    const row = map.get(dbKey);
    const raw = row?.valor ?? DEFAULTS[dbKey]?.valor ?? null;
    out[uiKey] = intStrict(raw) ?? Number(raw);
  }
  return out;
}

function hasAttr(model, attr) {
  return !!(model?.rawAttributes && Object.prototype.hasOwnProperty.call(model.rawAttributes, attr));
}

function pickAttr(model, candidates) {
  return candidates.find((c) => hasAttr(model, c)) || null;
}

async function safeCreateHistorial({ userId, userName, cambio, valorAnterior, valorNuevo, ip }) {
  // Si el modelo no existe o no está configurado, no rompas el PUT
  if (!HistorialConfiguracion) return;

  const payload = {};

  const fUsuarioId = pickAttr(HistorialConfiguracion, ["usuario_id", "user_id", "id_usuario", "usuarioId"]);
  const fUsuarioNombre = pickAttr(HistorialConfiguracion, ["usuario_nombre", "usuario", "user", "email", "username"]);
  const fCambio = pickAttr(HistorialConfiguracion, ["cambio", "descripcion", "accion", "detalle"]);
  const fAnterior = pickAttr(HistorialConfiguracion, ["valor_anterior", "anterior", "old_value", "valorAnterior"]);
  const fNuevo = pickAttr(HistorialConfiguracion, ["valor_nuevo", "nuevo", "new_value", "valorNuevo"]);
  const fIp = pickAttr(HistorialConfiguracion, ["ip", "direccion_ip", "address"]);
  const fFecha = pickAttr(HistorialConfiguracion, ["fecha", "fecha_hora"]); // si no existe, sequelize usa createdAt

  if (fUsuarioId) payload[fUsuarioId] = userId;
  if (fUsuarioNombre) payload[fUsuarioNombre] = userName;
  if (fCambio) payload[fCambio] = cambio;
  if (fAnterior) payload[fAnterior] = String(valorAnterior);
  if (fNuevo) payload[fNuevo] = String(valorNuevo);
  if (fIp) payload[fIp] = ip;
  if (fFecha) payload[fFecha] = new Date();

  try {
    await HistorialConfiguracion.create(payload);
  } catch (e) {
    console.warn("HistorialConfiguracion.create falló (no detiene el PUT):", e?.message || e);
  }
}

async function getParametros(req, res) {
  try {
    await ensureDefaults();
    const parametros = await readParamsObject();
    return res.json({ parametros });
  } catch (err) {
    console.error("getParametros error:", err);
    return res.status(500).json({ message: "Error obteniendo parámetros" });
  }
}

async function updateParametros(req, res) {
  try {
    await ensureDefaults();
    if (!requireAdmin(req, res)) return;

    // Acepta nombres alternos (compatibilidad)
    const stock_minimo = intStrict(req.body.stock_minimo ?? req.body.stock_minimo_global);
    const dias_recordatorio = intStrict(req.body.dias_recordatorio ?? req.body.dias_recordatorio_citas);
    const intentos_fallidos = intStrict(req.body.intentos_fallidos ?? req.body.limite_intentos_fallidos_login);

    const msg = validateRanges({ stock_minimo, dias_recordatorio, intentos_fallidos });
    if (msg) return res.status(400).json({ message: msg });

    const userId = getUserIdFromReq(req);
    const userName = getUserLabelFromReq(req);
    const ip = ipFromReq(req);

    const current = await readParamsObject();
    const updates = { stock_minimo, dias_recordatorio, intentos_fallidos };

    const changed = [];
    for (const k of Object.keys(updates)) {
      if (Number(current[k]) !== Number(updates[k])) changed.push(k);
    }

    // Guardar en DB usando DB_KEYS
    for (const uiKey of Object.keys(updates)) {
      const dbKey = DB_KEYS[uiKey];
      await upsertValue(dbKey, updates[uiKey], userId);
    }

    // Historial (tolerante)
    for (const uiKey of changed) {
      await safeCreateHistorial({
        userId,
        userName,
        cambio: `${LABELS[uiKey]}: ${current[uiKey]} → ${updates[uiKey]}`,
        valorAnterior: current[uiKey],
        valorNuevo: updates[uiKey],
        ip,
      });
    }

    const parametros = await readParamsObject();
    return res.json({ message: "Parámetros actualizados", parametros, changed });
  } catch (err) {
    console.error("updateParametros error:", err);
    return res.status(500).json({ message: "Error actualizando parámetros" });
  }
}

async function resetParametros(req, res) {
  try {
    await ensureDefaults();
    if (!requireAdmin(req, res)) return;

    const userId = getUserIdFromReq(req);
    const userName = getUserLabelFromReq(req);
    const ip = ipFromReq(req);

    const current = await readParamsObject();

    // Valores por defecto en formato UI
    const defaultsUI = {
      stock_minimo: intStrict(DEFAULTS[DB_KEYS.stock_minimo].valor),
      dias_recordatorio: intStrict(DEFAULTS[DB_KEYS.dias_recordatorio].valor),
      intentos_fallidos: intStrict(DEFAULTS[DB_KEYS.intentos_fallidos].valor),
    };

    // Guardar defaults
    for (const uiKey of Object.keys(defaultsUI)) {
      const dbKey = DB_KEYS[uiKey];
      await upsertValue(dbKey, defaultsUI[uiKey], userId);

      if (String(current[uiKey]) !== String(defaultsUI[uiKey])) {
        await safeCreateHistorial({
          userId,
          userName,
          cambio: `${LABELS[uiKey]}: ${current[uiKey]} → ${defaultsUI[uiKey]}`,
          valorAnterior: current[uiKey],
          valorNuevo: defaultsUI[uiKey],
          ip,
        });
      }
    }

    const parametros = await readParamsObject();
    return res.json({ message: "Restablecido a valores por defecto", parametros });
  } catch (err) {
    console.error("resetParametros error:", err);
    return res.status(500).json({ message: "Error restableciendo parámetros" });
  }
}

async function getHistorial(req, res) {
  try {
    // 🔸 Si querés que SOLO admin vea historial, descomentá:
    // if (!requireAdmin(req, res)) return;

    const page = Math.max(1, intStrict(req.query.page ?? req.query.pagina) || 1);
    const limit = Math.min(100, Math.max(1, intStrict(req.query.limit ?? req.query.limite) || 10));
    const offset = (page - 1) * limit;

    const usuario = String(req.query.usuario || "").trim();
    const desde = String(req.query.desde || "").trim();
    const hasta = String(req.query.hasta || "").trim();

    const where = {};

    // Usuario (si existe la columna)
    const colUsuario = pickAttr(HistorialConfiguracion, ["usuario_nombre", "usuario", "user", "email", "username"]);
    if (usuario && colUsuario) where[colUsuario] = { [Op.like]: `%${usuario}%` };

    // Fecha range (si existe fecha/fecha_hora, si no, usa createdAt)
    const colFecha =
      pickAttr(HistorialConfiguracion, ["fecha", "fecha_hora"]) ||
      (hasAttr(HistorialConfiguracion, "createdAt") ? "createdAt" : null);

    if (colFecha) {
      if (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)) {
        where[colFecha] = where[colFecha] || {};
        where[colFecha][Op.gte] = new Date(`${desde}T00:00:00`);
      }
      if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
        where[colFecha] = where[colFecha] || {};
        where[colFecha][Op.lte] = new Date(`${hasta}T23:59:59`);
      }
    }

    const orderCol = colFecha || "id";
    const { count, rows } = await HistorialConfiguracion.findAndCountAll({
      where,
      order: [[orderCol, "DESC"]],
      limit,
      offset,
    });

    // Respuesta compatible con tu frontend (total + rows/datos)
    return res.json({
      page,
      limit,
      total: count,
      rows,
      // aliases por compatibilidad:
      pagina: page,
      limite: limit,
      total_registros: count,
      registros: rows,
      datos: rows,
    });
  } catch (err) {
    console.error("getHistorial error:", err);
    return res.status(500).json({ message: "Error obteniendo historial" });
  }
}

function escapeCsv(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

async function exportHistorial(req, res) {
  try {
    if (!requireAdmin(req, res)) return;

    const format = String(req.query.format || "csv").toLowerCase();

    const usuario = String(req.query.usuario || "").trim();
    const desde = String(req.query.desde || "").trim();
    const hasta = String(req.query.hasta || "").trim();

    const where = {};
    const colUsuario = pickAttr(HistorialConfiguracion, ["usuario_nombre", "usuario", "user", "email", "username"]);
    if (usuario && colUsuario) where[colUsuario] = { [Op.like]: `%${usuario}%` };

    const colFecha =
      pickAttr(HistorialConfiguracion, ["fecha", "fecha_hora"]) ||
      (hasAttr(HistorialConfiguracion, "createdAt") ? "createdAt" : null);

    if (colFecha) {
      if (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)) {
        where[colFecha] = where[colFecha] || {};
        where[colFecha][Op.gte] = new Date(`${desde}T00:00:00`);
      }
      if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
        where[colFecha] = where[colFecha] || {};
        where[colFecha][Op.lte] = new Date(`${hasta}T23:59:59`);
      }
    }

    // Export simple (CSV)
    const orderCol = colFecha || "id";
    const rows = await HistorialConfiguracion.findAll({
      where,
      order: [[orderCol, "DESC"]],
      limit: 5000,
    });

    const colCambio = pickAttr(HistorialConfiguracion, ["cambio", "descripcion", "accion", "detalle"]);
    const colIp = pickAttr(HistorialConfiguracion, ["ip", "direccion_ip", "address"]);

    const header = ["fecha", "usuario", "cambio", "ip"];
    const lines = [header.join(",")];

    for (const r of rows) {
      const fecha = colFecha ? r[colFecha] : r.createdAt || "";
      const usr = colUsuario ? r[colUsuario] : "";
      const cambio = colCambio ? r[colCambio] : "";
      const ip = colIp ? r[colIp] : "";

      lines.push([fecha, usr, cambio, ip].map(escapeCsv).join(","));
    }

    const csv = lines.join("\n");
    const filenameBase = "historial_parametros";

    if (format === "excel") {
      res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.xls"`);
      return res.send(csv);
    }

    if (format === "pdf") {
      return res.status(501).json({ message: "Export PDF no implementado aún. Usa CSV o Excel." });
    }

    // default csv
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error("exportHistorial error:", err);
    return res.status(500).json({ message: "Error exportando historial" });
  }
}

module.exports = {
  getParametros,
  updateParametros,
  resetParametros,
  getHistorial,
  exportHistorial,
};