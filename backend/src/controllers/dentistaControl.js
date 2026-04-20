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

const dentistaController = {

    registrar: async (req, res) => {
        try {
            const { nombre, especialidad, telefono, email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "Email y contraseña son obligatorios" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPass = await bcrypt.hash(password, salt);

            const nombreUsuario = email.split('@')[0];

            const nuevoUsuario = await Usuario.create({
                username: nombreUsuario,
                email: email,
                password_hash: hashedPass,
                rol: "dentista",         
                activo: true,
                primer_acceso: true
            });

            const nuevoDentista = await Dentista.create({
                nombre: nombre,
                especialidad: especialidad,
                telefono: telefono,
                email: email,
                id_usuario: nuevoUsuario.id 
            });

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
                    password_visualizada: password
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

    obtenerPerfil: async (req, res) => {
        try {
            const userId = req.user.id;

            const dentista = await Dentista.findOne({
                where: { id_usuario: userId }
            });

            if (!dentista) {
                return res.status(404).json({ message: "Dentista no encontrado" });
            }

            res.json({
                nombre: dentista.nombre,
                especialidad: dentista.especialidad || "Odontólogo",
                foto_url: dentista.foto_url || null,  // ── NUEVO
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error obteniendo perfil" });
        }
    },

    editarPerfil: async (req, res) => {
        try {
            const userId = req.user.id;
            const { nombre, especialidad, telefono, correo } = req.body;

            const dentista = await Dentista.findOne({ where: { id_usuario: userId } });
            if (!dentista) return res.status(404).json({ message: 'Dentista no encontrado' });

            await dentista.update({ nombre, especialidad, telefono, email: correo });

            res.json({ message: 'Perfil actualizado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al actualizar perfil' });
        }
    },

    cambiarPassword: async (req, res) => {
        try {
            const userId = req.user.id;
            const { passwordActual, passwordNueva } = req.body;

            const usuario = await Usuario.findByPk(userId);
            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

            const valida = await bcrypt.compare(passwordActual, usuario.password_hash);
            if (!valida) return res.status(401).json({ message: 'La contraseña actual es incorrecta' });

            const hash = await bcrypt.hash(passwordNueva, 10);
            await usuario.update({ password_hash: hash });

            res.json({ message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al cambiar contraseña' });
        }
    },

    subirFoto: async (req, res) => {
        try {
            const userId = req.user.id;
            if (!req.file) return res.status(400).json({ message: 'No se recibió ninguna imagen' });

            const url = `/uploads/fotos/${req.file.filename}`;

            const dentista = await Dentista.findOne({ where: { id_usuario: userId } });
            if (!dentista) return res.status(404).json({ message: 'Dentista no encontrado' });

            await dentista.update({ foto_url: url });
            res.json({ message: 'Foto actualizada', url });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al subir foto' });
        }
    },

    eliminarFoto: async (req, res) => {
        try {
            const userId = req.user.id;
            const dentista = await Dentista.findOne({ where: { id_usuario: userId } });
            if (!dentista) return res.status(404).json({ message: 'Dentista no encontrado' });

            await dentista.update({ foto_url: null });
            res.json({ message: 'Foto eliminada' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al eliminar foto' });
        }
    },
};

module.exports = dentistaController;