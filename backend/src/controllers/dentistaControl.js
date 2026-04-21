const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs'); 
const { Usuario, Dentista } = require('../models');

// Configuración del correo
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
        user: "alejandramonc23@gmail.com", 
        pass: "abwpiloudlqertve" 
    }
});

const asegurarDirectorio = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const procesarFotoPerfil = async (buffer, mimeType) => {
  const output = sharp(buffer).rotate().resize({ width: 900, withoutEnlargement: true });

  if (mimeType === 'image/png') {
    return output.png({ compressionLevel: 8 }).toBuffer();
  }

  if (mimeType === 'image/webp') {
    return output.webp({ quality: 80 }).toBuffer();
  }

  return output.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
};

const obtenerExtensionDesdeMime = (mimeType) => {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
};

const ensureAdminUsuario = async () => {
  let adminUsuario = await Usuario.findOne({
    where: { username: "Admin", rol: "admin" },
  });

  if (adminUsuario) {
    return adminUsuario;
  }

  const hashAdminTemporal = await bcrypt.hash("Admin123", 10);
  adminUsuario = await Usuario.create({
    username: "Admin",
    email: "admin@dentmed.com",
    password_hash: hashAdminTemporal,
    rol: "admin",
    activo: true,
    primer_acceso: false,
  });

  return adminUsuario;
};

const ensureAdminPerfil = async (adminUsuario) => {
  let adminPerfil = await Dentista.findOne({ where: { id_usuario: adminUsuario.id } });

  if (!adminPerfil) {
    adminPerfil = await Dentista.create({
      id_usuario: adminUsuario.id,
      nombre: "Admin",
      apellidos: "",
      especialidad: "Administrador",
      telefono: "",
      email: adminUsuario.email,
      numero_licencia: "ADMIN",
    });
  }

  return adminPerfil;
};

const dentistaController = {

    // TAREA: Registro (POST) - SINCRONIZADA CON FRONTEND
    registrar: async (req, res) => {
        try {
            // Extraemos la contraseña que viene directamente del formulario del frontend
            const { nombre, especialidad, telefono, email, password } = req.body;

            // Validación de seguridad
            if (!email || !password) {
                return res.status(400).json({ error: "Email y contraseña son obligatorios" });
            }

            // 1. Generar Hash usando la contraseña EXACTA del frontend
            const salt = await bcrypt.genSalt(10);
            const hashedPass = await bcrypt.hash(password, salt);

            // 2. Generar nombre de usuario automático basado en el email
            const nombreUsuario = email.split('@')[0];

            // 3. Crear el Usuario en la base de datos
            const nuevoUsuario = await Usuario.create({
                username: nombreUsuario,
                email: email,
                password_hash: hashedPass,
                rol: "dentista",         
                activo: true,
                primer_acceso: true
            });

            // 4. Crear el perfil del Dentista vinculado al usuario
            const nuevoDentista = await Dentista.create({
                nombre: nombre,
                especialidad: especialidad,
                telefono: telefono,
                email: email,
                id_usuario: nuevoUsuario.id 
            });

            // 5. Enviar correo usando la contraseña que el usuario vio en el frontend
            const mailOptions = {
                from: '"Sistema DentMed" <alejandramonc23@gmail.com>',
                to: email, 
                subject: "¡Bienvenido al Sistema DentMed!",
                text: `Hola ${nombre},\n\n` +
                      `Tu cuenta ha sido creada exitosamente en el sistema.\n\n` +
                      `Tus credenciales de acceso son:\n` +
                      `Usuario: ${nombreUsuario}\n` +
                      `Contraseña Temporal: ${password}\n\n` + 
                      `Por seguridad, cámbiala al iniciar sesión por primera vez.`
            };

            await transporter.sendMail(mailOptions);
            
            res.status(201).json({ 
                mensaje: "Registro exitoso y correo enviado", 
                dentista: nuevoDentista,
                usuario: {
                    username: nombreUsuario,
                    password_visualizada: password // Confirmación para depuración
                }
            });

        } catch (error) {
            console.error("ERROR EN REGISTRO:", error);
            res.status(500).json({ 
                error: "Error al registrar", 
                detalle: error.message 
            });
        }
    },
    listarTodos: async (req, res) => {
        try {
            const lista = await Dentista.findAll({
                include: [{ model: Usuario, attributes: ['email', 'activo'] }]
            });
            res.status(200).json(lista);
        } catch (error) {
            res.status(500).json({ error: "Error al cargar la lista" });
        }
    },

    editarDatos: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, especialidad, telefono } = req.body;
            await Dentista.update({ nombre, especialidad, telefono }, { where: { id } });
            res.json({ mensaje: "Datos del dentista actualizados" });
        } catch (error) {
            res.status(500).json({ error: "Error al editar" });
        }
    },

    cambiarEstado: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            const { activo, emailDentista } = req.body; 

            await Usuario.update({ activo }, { where: { id: idUsuario } });

            if (activo === false || activo === 0) {
                const mailOptions = {
                    from: '"Sistema DentMed" <alejandramonc23@gmail.com>', 
                    to: emailDentista,
                    subject: "Cuenta Inhabilitada",
                    text: "Su acceso al sistema ha sido desactivado."
                };
                await transporter.sendMail(mailOptions);
            }

            res.json({ mensaje: "Estado actualizado" });
        } catch (error) {
            res.status(500).json({ error: "Error interno", detalle: error.message });
        }
    },

    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            await Dentista.destroy({ where: { id } });
            res.json({ mensaje: "Dentista eliminado" });
        } catch (error) {
            res.status(500).json({ error: "No se puede eliminar: registros vinculados" });
        }
    },

    actualizarPerfil: async (req, res) => {
      try {
        const authUser = req.user || {};
        const isAdminMaster = authUser?.master === true && authUser?.rol === "admin";
        let usuario = null;

        if (isAdminMaster) {
          usuario = await ensureAdminUsuario();
        } else {
          const userId = authUser?.id;
          if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
          }
          usuario = await Usuario.findByPk(userId);
        }

        if (!usuario) {
          return res.status(401).json({ message: "Usuario no autenticado" });
        }

        const { nombre, apellidos, email, telefono, contrasena } = req.body;
        let dentista = await Dentista.findOne({ where: { id_usuario: usuario.id } });
        if (usuario.rol === "admin") {
          dentista = await ensureAdminPerfil(usuario);
        }

        const usuarioUpdates = {};
        const dentistaUpdates = {};

        if (email) {
          const normalizedEmail = String(email).trim().toLowerCase();
          const currentEmail = String(usuario.email || "").trim().toLowerCase();

          if (normalizedEmail !== currentEmail) {
            const emailEnUso = await Usuario.findOne({ where: { email: normalizedEmail } });
            if (emailEnUso && emailEnUso.id !== usuario.id) {
              if (emailEnUso.rol === "dentista") {
                return res.status(400).json({ message: "Este correo ya está registrado como doctor." });
              }
              return res.status(400).json({ message: "Este correo ya está registrado en el sistema." });
            }
          }

          usuarioUpdates.email = normalizedEmail;
          if (dentista) {
            dentistaUpdates.email = normalizedEmail;
          }
        }
        if (contrasena) {
          const hash = await bcrypt.hash(String(contrasena), 10);
          usuarioUpdates.password_hash = hash;
        }

        if (nombre) {
          dentistaUpdates.nombre = String(nombre).trim();
        }
        if (apellidos) {
          dentistaUpdates.apellidos = String(apellidos).trim();
        }
        if (telefono) {
          dentistaUpdates.telefono = String(telefono).trim();
        }

        if (req.file) {
          const uploadDir = path.join(__dirname, "../../uploads/avatars");
          asegurarDirectorio(uploadDir);

          const extension = obtenerExtensionDesdeMime(req.file.mimetype);
          const filename = `${uuidv4()}.${extension}`;
          const filePath = path.join(uploadDir, filename);
          const bufferFinal = await procesarFotoPerfil(req.file.buffer, req.file.mimetype);

          fs.writeFileSync(filePath, bufferFinal);
          usuarioUpdates.avatar = `/uploads/avatars/${filename}`;
        }

        if (Object.keys(usuarioUpdates).length > 0) {
          await Usuario.update(usuarioUpdates, { where: { id: usuario.id } });
        }

        if (dentista && Object.keys(dentistaUpdates).length > 0) {
          await Dentista.update(dentistaUpdates, { where: { id_usuario: usuario.id } });
        }

        const perfilActualizado = await Dentista.findOne({
          where: { id_usuario: usuario.id },
          include: [{ model: Usuario, attributes: ['email', 'avatar'] }],
        });

        if (!perfilActualizado) {
          return res.status(404).json({ message: "Perfil no encontrado" });
        }

        res.json({
          message: "Perfil actualizado",
          perfil: {
            nombre: perfilActualizado.nombre,
            apellidos: perfilActualizado.apellidos,
            especialidad: perfilActualizado.especialidad,
            telefono: perfilActualizado.telefono,
            email: perfilActualizado.email || perfilActualizado.Usuario?.email,
            avatar: perfilActualizado.Usuario?.avatar || null,
          },
        });
      } catch (error) {
        console.error("Error actualizando perfil:", error);
        res.status(500).json({ message: "Error actualizando perfil", detalle: error.message });
      }
    },

    obtenerPerfil: async (req, res) => {
      try {
        const authUser = req.user || {};
        const isAdminMaster = authUser?.master === true && authUser?.rol === "admin";
        let usuario = null;

        if (isAdminMaster) {
          usuario = await ensureAdminUsuario();
          await ensureAdminPerfil(usuario);
        } else {
          const userId = authUser?.id;
          if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
          }
          usuario = await Usuario.findByPk(userId);
        }

        if (!usuario) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const dentista = await Dentista.findOne({
          where: { id_usuario: usuario.id },
          include: [{ model: Usuario, attributes: ['email', 'avatar'] }],
        });

        if (!dentista) {
          return res.status(404).json({ message: "Perfil no encontrado" });
        }

        res.json({
          nombre: dentista.nombre,
          apellidos: dentista.apellidos,
          especialidad: dentista.especialidad || "Odontólogo",
          telefono: dentista.telefono || "",
          email: dentista.email || dentista.Usuario?.email || "",
          avatar: dentista.Usuario?.avatar || null,
        });

      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error obteniendo perfil" });
      }
    },

    cambiarContrasena: async (req, res) => {
      try {
        const authUser = req.user || {};
        const isAdminMaster = authUser?.master === true && authUser?.rol === "admin";
        let usuario = null;

        if (isAdminMaster) {
          usuario = await ensureAdminUsuario();
        } else {
          const userId = authUser?.id;
          if (!userId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
          }
          usuario = await Usuario.findByPk(userId);
        }

        if (!usuario) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const currentPassword = String(req.body?.currentPassword || "");
        const newPassword = String(req.body?.newPassword || "");
        const confirmPassword = String(req.body?.confirmPassword || "");

        if (!currentPassword || !newPassword || !confirmPassword) {
          return res.status(400).json({ message: "Todos los campos son obligatorios." });
        }

        if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: "La nueva contraseña y su confirmación no coinciden." });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres." });
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, usuario.password_hash);
        if (!isCurrentValid) {
          return res.status(400).json({ message: "La contraseña actual es incorrecta." });
        }

        const isSamePassword = await bcrypt.compare(newPassword, usuario.password_hash);
        if (isSamePassword) {
          return res.status(400).json({ message: "La nueva contraseña debe ser diferente a la actual." });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await Usuario.update(
          { password_hash: newHash, primer_acceso: false },
          { where: { id: usuario.id } }
        );

        return res.json({ message: "Contraseña actualizada correctamente." });
      } catch (error) {
        console.error("Error cambiando contraseña:", error);
        return res.status(500).json({ message: "Error al cambiar contraseña." });
      }
    }
  };

module.exports = dentistaController;