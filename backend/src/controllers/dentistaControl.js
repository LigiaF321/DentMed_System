const nodemailer = require('nodemailer');
const { Usuario, Dentista } = require('../models');

// 1. Configuración del correo
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

    // TAREA: Registro (POST)
    registrar: async (req, res) => {
        try {
            const { nombre, especialidad, telefono, email, password } = req.body;

            // Paso A: Crear el Usuario
            const nuevoUsuario = await Usuario.create({
                email: email,
                password_hash: password, // Coincide con tu modelo
                rol: "dentista",          // Evita el error de campo obligatorio
                activo: true
            });

            // Paso B: Crear el Dentista
            // NOTA: Si da error aquí, intenta cambiar 'id_usuario' por 'idUsuario'
            const nuevoDentista = await Dentista.create({
                nombre: nombre,
                especialidad: especialidad,
                telefono: telefono,
                id_usuario: nuevoUsuario.id 
            });

            // Paso C: Enviar correo
            const mailOptions = {
                from: '"Sistema DentMed" <alejandramonc23@gmail.com>',
                to: email, 
                subject: "¡Bienvenido al Sistema DentMed!",
                text: `Hola ${nombre}, tu cuenta ha sido creada exitosamente.`
            };

            await transporter.sendMail(mailOptions);
            
            res.status(201).json({ 
                mensaje: "Registro exitoso y correo enviado", 
                dentista: nuevoDentista 
            });

        } catch (error) {
            console.error("ERROR EN REGISTRO:", error);
            res.status(500).json({ 
                error: "Error al registrar", 
                detalle: error.message 
            });
        }
    },

    // TAREA 1: Listar (GET)
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

    // TAREA 2: Editar (PUT)
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

    // TAREA 3, 4 y 8: Estado + Email (PATCH)
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

    // TAREA 5 y 6: Eliminar (DELETE)
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