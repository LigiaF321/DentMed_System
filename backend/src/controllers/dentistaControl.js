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

    // TAREA: Registro (POST) - CORREGIDA
    registrar: async (req, res) => {
        try {
            const { nombre, especialidad, telefono, email, password } = req.body;

            // Validación rápida para evitar errores de base de datos
            if (!email || !password) {
                return res.status(400).json({ error: "Email y contraseña son obligatorios" });
            }

            // 1. Generar Hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPass = await bcrypt.hash(password, salt);

            // 2. Generar nombre de usuario automático
            const nombreUsuario = email.split('@')[0];

            // 3. Crear el Usuario
            const nuevoUsuario = await Usuario.create({
                username: nombreUsuario,
                email: email,
                password_hash: hashedPass,
                rol: "dentista",         
                activo: true,
                primer_acceso: true
            });

            // 4. Crear el Dentista
            const nuevoDentista = await Dentista.create({
                nombre: nombre,
                especialidad: especialidad,
                telefono: telefono,
                email: email,
                id_usuario: nuevoUsuario.id 
            });

            // 5. Enviar correo (AHORA INCLUYE LA CONTRASEÑA)
            const mailOptions = {
                from: '"Sistema DentMed" <alejandramonc23@gmail.com>',
                to: email, 
                subject: "¡Bienvenido al Sistema DentMed!",
                // Usamos template strings (comillas invertidas) para mostrar los datos
                text: `Hola ${nombre},\n\n` +
                      `Tu cuenta ha sido creada exitosamente en el sistema.\n\n` +
                      `Tus credenciales de acceso son:\n` +
                      `Usuario: ${nombreUsuario}\n` +
                      `Contraseña Temporal: ${password}\n\n` + // <--- Aquí aparece la clave
                      `Por seguridad, cámbiala al iniciar sesión por primera vez.`
            };

            await transporter.sendMail(mailOptions);
            
            res.status(201).json({ 
                mensaje: "Registro exitoso y correo enviado", 
                dentista: nuevoDentista,
                usuario: nombreUsuario
            });

        } catch (error) {
            console.error("ERROR EN REGISTRO:", error);
            res.status(500).json({ 
                error: "Error al registrar", 
                detalle: error.message 
            });
        }
    },

    // --- SECCIÓN DE COMPAÑEROS (SIN CAMBIOS) ---
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
    }
};

module.exports = dentistaController;