const bcrypt = require("bcryptjs");
const { sequelize, Usuario, Dentista, Auditoria } = require("../models");
const { getClientIp } = require("../utils/audit.utils");
const nodemailer = require('nodemailer');

// 1. Configuración de PHPMailer (Tarea 3.1)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
        user: "tu-correo@gmail.com", 
        pass: "tu-password-app" 
    }
});

async function createDentistAccount(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { nombre, apellidos, email, telefono, especialidad, licencia } = req.body;

        // Tarea 2.2: Generar Usuario Automático (ej: juan.perez)
        const primerNombre = nombre.trim().split(' ')[0].toLowerCase();
        const primerApellido = apellidos.trim().split(' ')[0].toLowerCase();
        const usuarioGenerado = `${primerNombre}.${primerApellido}`;

        // Tarea 2.2: Generar Contraseña Temporal
        const tempPassword = "DentMed" + new Date().getFullYear(); 
        const password_hash = await bcrypt.hash(tempPassword, 10);

        // Tarea 2.3: Doble Inserción
        // Crear Usuario con primer_acceso = true
        const user = await Usuario.create({
            email: email, 
            password_hash: password_hash,
            rol: "dentista",
            primer_acceso: true, // Requisito para el flujo de cambio de clave
            activo: true,
        }, { transaction: t });

        // Crear registro en tabla Dentistas
        const dentist = await Dentista.create({
            id_usuario: user.id,
            nombre,
            apellidos,
            especialidad,
            telefono,
            licencia,
        }, { transaction: t });

        // Tarea 2.4: Registro en Auditoría (Sin campos NULL)
        const adminId = req.headers["x-user-id"] || null;
        const ip = getClientIp(req);

        await Auditoria.create({
            id_usuario: adminId,
            accion: "CREAR_DENTISTA",
            modulo: "ADMINISTRACION",
            detalles: `Se creó cuenta al dentista: ${nombre} ${apellidos}. Usuario: ${usuarioGenerado}, Email: ${email}`,
            ip,
        }, { transaction: t });

        await t.commit();

        // Tarea 3.3: Envío de Email con credenciales
        const mailOptions = {
            from: '"Sistema DentMed" <tu-correo@gmail.com>',
            to: email,
            subject: "Credenciales de Acceso - DentMed",
            html: `<h3>Bienvenido Dr. ${nombre}</h3>
                   <p>Tu cuenta ha sido creada.</p>
                   <p><strong>Usuario:</strong> ${email}</p>
                   <p><strong>Contraseña Temporal:</strong> ${tempPassword}</p>
                   <p><i>Debes cambiar tu contraseña al ingresar por primera vez.</i></p>`
        };
        await transporter.sendMail(mailOptions);

        return res.status(201).json({
            message: "Dentista creado exitosamente",
            credenciales: {
                usuario: usuarioGenerado,
                password: tempPassword
            }
        });

    } catch (err) {
        if (t) await t.rollback();
        return next(err);
    }
}

module.exports = { createDentistAccount };