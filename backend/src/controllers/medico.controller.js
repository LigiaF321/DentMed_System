const { Usuario, Dentista } = require("../models");

// Tarea 6.1: GET /api/medico/dashboard
exports.getDashboardData = async (req, res) => {
    try {
        // El ID viene del token decodificado por el Middleware de Autenticación
        const usuarioId = req.user.id; 

        // Consultar datos personales usando id_usuario como llave foránea
        const datosMedicos = await Dentista.findOne({
            where: { id_usuario: usuarioId }, // <--- CORREGIDO AQUÍ
            include: [{
                model: Usuario,
                as: 'usuario', // Asegúrate que este alias coincida con tu modelo
                attributes: ['email'] 
            }]
        });

        if (!datosMedicos) {
            return res.status(404).json({ 
                success: false, 
                message: "No se encontraron datos del médico logueado." 
            });
        }

        // Responder con el formato solicitado en el documento
        return res.json({
            success: true,
            nombres: datosMedicos.nombre,
            apellidos: datosMedicos.apellidos,
            especialidad: datosMedicos.especialidad,
            email: datosMedicos.usuario ? datosMedicos.usuario.email : null,
            telefono: datosMedicos.telefono,
            proximasCitas: [] // Requisito Tarea 6.1 (array vacío)
        });

    } catch (error) {
        console.error("Error en Dashboard Médico:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error interno al obtener datos del perfil." 
        });
    }
};