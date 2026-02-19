const bcrypt = require("bcryptjs");
const { sequelize, Usuario, Dentista, Auditoria } = require("../models");
const { generateTemporaryPassword } = require("../utils/password.utils");
const { getClientIp } = require("../utils/audit.utils");
const {
  sendDentistCredentialsEmail,
} = require("../services/email.service");

async function createDentistAccount(req, res, next) {
  try {
    
    const { nombre, apellidos, email, telefono, especialidad, licencia } = req.body;

    
    if (!nombre || !email) {
      return res
        .status(400)
        .json({ error: "nombre y email son obligatorios" });
    }

    
    const existing = await Usuario.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "El email ya existe" });
    }

    
    const tempPassword = generateTemporaryPassword(10);
    const password_hash = await bcrypt.hash(tempPassword, 10);

    
    const result = await sequelize.transaction(async (t) => {
      
      const user = await Usuario.create(
        {
          email,
          password_hash,
          rol: "dentista",
          activo: true,
        },
        { transaction: t }
      );

      
      const dentist = await Dentista.create(
        {
          id_usuario: user.id,
          nombre,
          apellidos: apellidos || null,
          especialidad: especialidad || null,
          telefono: telefono || null,
          email,
          licencia: licencia || null,
        },
        { transaction: t }
      );

      const adminIdHeader = req.headers["x-user-id"];
      const adminId = adminIdHeader ? Number(adminIdHeader) : null;
      const ip = getClientIp(req);

      await Auditoria.create(
        {
          id_usuario: adminId,
          accion: "CREAR_DENTISTA",
          modulo: "GESTION_USUARIOS",
          detalles: JSON.stringify({
            dentistId: dentist.id,
            userId: user.id,
            email,
          }),
          ip,
        },
        { transaction: t }
      );

      return { user, dentist, tempPassword };
    });

    const emailResult = await sendDentistCredentialsEmail({
      to: email,
      tempPassword: result.tempPassword,
      nombre,
    });

    return res.status(201).json({
      message: "Dentista creado exitosamente",
      dentist: {
        id: result.dentist.id,
        nombre: result.dentist.nombre,
        apellidos: result.dentist.apellidos,
        email: result.user.email,
        especialidad: result.dentist.especialidad,
        telefono: result.dentist.telefono,
        licencia: result.dentist.licencia,
      },
      email: emailResult,
      
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createDentistAccount };
