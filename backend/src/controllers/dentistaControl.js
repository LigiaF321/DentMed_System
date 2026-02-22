const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs'); // Requerido para el hasheo de la Tarea 175
const { Usuario, Dentista } = require('../models');

// Configuración del correo (Tarea 3)
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

    // TAREA 1: Registro de Dentista (Completo y Corregido)
    registrar: async (req, res) => {
        try {
            const { nombre, apellidos, especialidad, telefono, email } = req.body;

            // 1. Unificar nombre y apellidos (Evita error de columna faltante en DB)
            const nombreCompleto = `${nombre} ${apellidos}`;

            // 2. Generar contraseña genérica automáticamente (Tarea 2)
            const passwordTemporal = "DentMed2026!"; 
            const salt = await bcrypt.genSalt(10);
            const hashedBuffer = await bcrypt.hash(passwordTemporal, salt);

            // 3. Crear el Usuario vinculando email y password_hash
            const nuevoUsuario = await Usuario.create({
                email: email,
                password_hash: hashedBuffer,
                rol: "dentista",          
                activo: true,
                primer_acceso: 1 // Indica cambio de contraseña obligatorio (Tarea 151)
            });

            // 4. Crear el Dentista vinculado al usuario recién creado
            const nuevoDentista = await Dentista.create({
                nombre: nombreCompleto, 
                especialidad: especialidad,
                telefono: telefono,
                id_usuario: nuevoUsuario.id 
            });

            // 5. Enviar correo de bienvenida con credenciales (Tarea 3)
            const mailOptions = {
                from: '"Sistema DentMed" <alejandramonc23@gmail.com>',
                to: email, 
                subject: "¡Bienvenido al Sistema DentMed!",
                html: `
                    <h1>Hola, Dr/a. ${nombre}</h1>
                    <p>Su cuenta ha sido creada exitosamente.</p>
                    <p><strong>Contraseña temporal:</strong> ${passwordTemporal}</p>
                    <p>Deberá cambiarla en su primer inicio de sesión.</p>
                `
            };

            await transporter.sendMail(mailOptions);
            
            res.status(201).json({ 
                mensaje: "Registro exitoso y correo enviado", 
                dentista: nuevoDentista 
            });

        } catch (error) {
            console.error("ERROR EN REGISTRO:", error);
            res.status(500).json({ error: "Error al registrar", detalle: error.message });
        }
    },

    // Listar todos los dentistas (Requerido por la ruta GET /)
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

    // Editar datos del dentista (Requerido por la ruta PUT /:id)
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

    // Cambiar estado de la cuenta (Requerido por la ruta PATCH /estado/:idUsuario)
    cambiarEstado: async (req, res) => {
        try {
            const { idUsuario } = req.params;
            const { activo } = req.body; 
            await Usuario.update({ activo }, { where: { id: idUsuario } });
            res.json({ mensaje: "Estado del usuario actualizado" });
        } catch (error) {
            res.status(500).json({ error: "Error al cambiar estado" });
        }
    },

    // Eliminar cuenta (Requerido por la ruta DELETE /:id)
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            await Dentista.destroy({ where: { id } });
            res.json({ mensaje: "Dentista eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar" });
        }
    }
};

module.exports = dentistaController;