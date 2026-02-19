/**
 * Controlador: Gestionar Cuentas (admin)
 * Endpoints para listar, editar, inhabilitar/habilitar y eliminar dentistas
 */
const { Op } = require("sequelize");
const { Usuario, Dentista, Cita, Auditoria } = require("../models");
const { getClientIp } = require("../utils/audit.utils");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/**
 * Formatea un dentista para la respuesta (incluye nombre completo, estado, fecha)
 */
function formatDentistaForList(d) {
  const nombreCompleto = [d.nombre, d.apellidos].filter(Boolean).join(" ").trim() || d.nombre;
  return {
    id: d.id,
    id_usuario: d.id_usuario,
    nombre_completo: nombreCompleto,
    nombres: d.nombre,
    apellidos: d.apellidos,
    email: d.Usuario?.email ?? d.email,
    especialidad: d.especialidad,
    telefono: d.telefono,
    licencia: d.licencia,
    estado: d.Usuario?.activo ? "activo" : "inactivo",
    activo: !!d.Usuario?.activo,
    fecha_registro: d.createdAt,
  };
}

/**
 * GET /api/admin/dentistas
 * Lista dentistas con filtros y paginación
 */
async function listarDentistas(req, res, next) {
  try {
    const { nombre, email, estado, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;
    const offset = (Math.max(1, Number(page)) - 1) * Math.min(50, Math.max(1, Number(limit)));

    const whereDentista = {};
    const whereUsuario = { rol: "dentista" };

    if (nombre && String(nombre).trim()) {
      whereDentista[Op.or] = [
        { nombre: { [Op.like]: `%${String(nombre).trim()}%` } },
        { apellidos: { [Op.like]: `%${String(nombre).trim()}%` } },
      ];
    }
    if (email && String(email).trim()) {
      whereUsuario.email = { [Op.like]: `%${String(email).trim()}%` };
    }
    if (estado === "activo" || estado === "activos") {
      whereUsuario.activo = true;
    } else if (estado === "inactivo" || estado === "inactivos") {
      whereUsuario.activo = false;
    }

    const usuarioInclude = {
      model: Usuario,
      attributes: ["id", "email", "activo"],
      ...(Object.keys(whereUsuario).length ? { where: whereUsuario } : {}),
    };

    const { count, rows } = await Dentista.findAndCountAll({
      include: [usuarioInclude],
      where: Object.keys(whereDentista).length ? whereDentista : undefined,
      limit: Math.min(50, Math.max(1, Number(limit))),
      offset,
      order: [["createdAt", "DESC"]],
    });

    const data = rows.map(formatDentistaForList);

    return res.json({
      data,
      paginacion: {
        total: count,
        pagina: Math.max(1, Number(page)),
        por_pagina: Math.min(50, Math.max(1, Number(limit))),
        total_paginas: Math.ceil(count / Math.min(50, Math.max(1, Number(limit)))),
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/admin/dentistas/:id
 * Obtiene un dentista por ID (para formulario de edición)
 */
async function obtenerDentista(req, res, next) {
  try {
    const { id } = req.params;
    const dentista = await Dentista.findByPk(id, {
      include: [{ model: Usuario, attributes: ["id", "email", "activo"] }],
    });

    if (!dentista) {
      return res.status(404).json({ error: "Dentista no encontrado" });
    }

    const d = formatDentistaForList(dentista);
    return res.json(d);
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/admin/dentistas/:id
 * Actualiza datos del dentista (nombres, apellidos, email, etc.)
 */
async function actualizarDentista(req, res, next) {
  try {
    const { id } = req.params;
    const { nombres, apellidos, nombre, email, telefono, especialidad, licencia } = req.body;
    const adminId = req.headers["x-user-id"] ? Number(req.headers["x-user-id"]) : null;
    const ip = getClientIp(req);

    const dentista = await Dentista.findByPk(id, {
      include: [{ model: Usuario }],
    });

    if (!dentista) {
      return res.status(404).json({ error: "Dentista no encontrado" });
    }

    const nuevoEmail = email?.trim() || dentista.Usuario?.email;
    if (nuevoEmail && dentista.Usuario?.email !== nuevoEmail) {
      const existe = await Usuario.findOne({ where: { email: nuevoEmail } });
      if (existe) {
        return res.status(409).json({ error: "El email ya está en uso por otro usuario" });
      }
    }

    const nombreActual = nombres ?? nombre ?? dentista.nombre;
    const apellidosActual = apellidos ?? dentista.apellidos;

    await dentista.update({
      nombre: nombreActual,
      apellidos: apellidosActual ?? null,
      telefono: telefono ?? dentista.telefono,
      especialidad: especialidad ?? dentista.especialidad,
      licencia: licencia !== undefined ? licencia : dentista.licencia,
      email: nuevoEmail ?? dentista.email,
    });

    if (dentista.Usuario && nuevoEmail && dentista.Usuario.email !== nuevoEmail) {
      await dentista.Usuario.update({ email: nuevoEmail });
    }

    await Auditoria.create({
      id_usuario: adminId,
      accion: "ACTUALIZAR_DENTISTA",
      modulo: "GESTION_USUARIOS",
      detalles: JSON.stringify({ dentistaId: dentista.id, email: nuevoEmail }),
      ip,
    });

    const actualizado = await Dentista.findByPk(id, {
      include: [{ model: Usuario, attributes: ["id", "email", "activo"] }],
    });
    return res.json(formatDentistaForList(actualizado));
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/admin/dentistas/:id/estado
 * Cambia estado activo/inactivo del dentista
 */
async function cambiarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    const adminId = req.headers["x-user-id"] ? Number(req.headers["x-user-id"]) : null;
    const ip = getClientIp(req);

    const dentista = await Dentista.findByPk(id, {
      include: [{ model: Usuario }],
    });

    if (!dentista) {
      return res.status(404).json({ error: "Dentista no encontrado" });
    }

    if (!dentista.Usuario) {
      return res.status(500).json({ error: "Usuario asociado no encontrado" });
    }

    const nuevoEstado = activo === true || activo === "true" || activo === 1;
    await dentista.Usuario.update({ activo: nuevoEstado });

    await Auditoria.create({
      id_usuario: adminId,
      accion: nuevoEstado ? "HABILITAR_DENTISTA" : "INHABILITAR_DENTISTA",
      modulo: "GESTION_USUARIOS",
      detalles: JSON.stringify({ dentistaId: dentista.id, estado: nuevoEstado ? "activo" : "inactivo" }),
      ip,
    });

    const actualizado = await Dentista.findByPk(id, {
      include: [{ model: Usuario, attributes: ["id", "email", "activo"] }],
    });
    return res.json(formatDentistaForList(actualizado));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/admin/dentistas/:id/dependencias
 * Verifica si el dentista tiene dependencias que impidan eliminarlo
 */
async function verificarDependencias(req, res, next) {
  try {
    const { id } = req.params;
    const dentista = await Dentista.findByPk(id);

    if (!dentista) {
      return res.status(404).json({ error: "Dentista no encontrado" });
    }

    const ahora = new Date();
    const citasFuturas = await Cita.count({
      where: {
        id_dentista: id,
        fecha_hora: { [Op.gt]: ahora },
        estado: { [Op.notIn]: ["Cancelada", "Completada"] },
      },
    });

    const totalCitas = await Cita.count({ where: { id_dentista: id } });

    const puedeEliminar = citasFuturas === 0;
    return res.json({
      puede_eliminar: puedeEliminar,
      citas_futuras: citasFuturas,
      total_citas: totalCitas,
      mensaje: puedeEliminar
        ? "No hay dependencias que impidan la eliminación"
        : `El dentista tiene ${citasFuturas} cita(s) futura(s) programada(s). Debe cancelarlas o reprogramarlas antes de eliminar.`,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/admin/dentistas/:id
 * Elimina el dentista (hard delete). Valida que no tenga citas futuras.
 */
async function eliminarDentista(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.headers["x-user-id"] ? Number(req.headers["x-user-id"]) : null;
    const ip = getClientIp(req);

    const dentista = await Dentista.findByPk(id, { include: [{ model: Usuario }] });

    if (!dentista) {
      return res.status(404).json({ error: "Dentista no encontrado" });
    }

    const ahora = new Date();
    const citasFuturas = await Cita.count({
      where: {
        id_dentista: id,
        fecha_hora: { [Op.gt]: ahora },
        estado: { [Op.notIn]: ["Cancelada", "Completada"] },
      },
    });

    if (citasFuturas > 0) {
      return res.status(400).json({
        error: "No se puede eliminar",
        mensaje: `El dentista tiene ${citasFuturas} cita(s) futura(s). Cancele o reprograme antes de eliminar.`,
      });
    }

    const idUsuario = dentista.id_usuario;

    // Eliminar citas asociadas (pasadas) para poder borrar el dentista (FK RESTRICT)
    await Cita.destroy({ where: { id_dentista: id } });
    await Dentista.destroy({ where: { id } });
    await Usuario.destroy({ where: { id: idUsuario } });

    await Auditoria.create({
      id_usuario: adminId,
      accion: "ELIMINAR_DENTISTA",
      modulo: "GESTION_USUARIOS",
      detalles: JSON.stringify({ dentistaId: id, email: dentista.Usuario?.email }),
      ip,
    });

    return res.json({ mensaje: "Dentista eliminado correctamente" });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listarDentistas,
  obtenerDentista,
  actualizarDentista,
  cambiarEstado,
  verificarDependencias,
  eliminarDentista,
};
