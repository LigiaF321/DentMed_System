const Bloque = require('../models/bloque'); 
const Cita = require('../models/Cita');
const { Op } = require('sequelize');

// 3. Se envía POST /api/bloques
exports.crearBloqueo = async (req, res) => {
    // 2. Datos provenientes del Modal (Tipo, Fecha, Horas, Recurrencia, Descripción)
    const { id_dentista, tipo, fecha, hora_inicio, hora_fin, recurrencia, descripcion, dia_completo } = req.body;

    try {
        // Manejo del punto "Día completo" del flujo
        const inicio = dia_completo ? `${fecha} 00:00:00` : `${fecha} ${hora_inicio}:00`;
        const fin = dia_completo ? `${fecha} 23:59:59` : `${fecha} ${hora_fin}:00`;

        // 4. Backend valida que no solape con citas existentes
        const citaSolapada = await Cita.findOne({
            where: {
                id_dentista,
                estado: 'programada',
                [Op.or]: [
                    { fecha_hora: { [Op.between]: [inicio, fin] } },
                    { fecha_hora: inicio }
                ]
            }
        });

        if (citaSolapada) {
            return res.status(400).json({
                ok: false,
                message: 'No se puede bloquear el horario: Ya existe una cita programada en este rango.'
            });
        }

        // 4. Backend guarda en la tabla 'bloques'
        const nuevoBloque = await Bloque.create({
            id_dentista,
            tipo, // procedimiento largo, reunión, ausencia, personal
            fecha_inicio: inicio,
            fecha_fin: fin,
            recurrencia: recurrencia || 'ninguna',
            descripcion,
            activo: true
        });

        res.status(201).json({
            ok: true,
            message: 'Horario bloqueado con éxito',
            nuevoBloque
        });

    } catch (error) {
        console.error('Error en crearBloqueo:', error);
        res.status(500).json({ ok: false, message: 'Error interno al procesar el bloqueo.' });
    }
};

// 5. El calendario utiliza este endpoint para mostrar los bloques
exports.obtenerBloques = async (req, res) => {
    const id_dentista = req.params.id_dentista || req.query.id_dentista;
    
    if (!id_dentista) {
        return res.status(400).json({ ok: false, message: 'El id_dentista es obligatorio.' });
    }

    try {
        const bloques = await Bloque.findAll({ 
            where: { id_dentista, activo: true } 
        });

        res.json({ ok: true, bloques });
    } catch (error) {
        console.error('Error en obtenerBloques:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener los bloques.' });
    }
};

// 7. Dentista puede hacer clic en bloque → botón "Desbloquear"
// Nota: Usamos eliminación lógica (activo: false) para no perder historial médico/administrativo
exports.eliminarBloque = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await Bloque.update({ activo: false }, { where: { id } });
        if (resultado[0] === 0) {
            return res.status(404).json({ ok: false, message: 'Bloque no encontrado.' });
        }
        res.json({ ok: true, message: 'Horario desbloqueado correctamente.' });
    } catch (error) {
        console.error('Error en eliminarBloque:', error);
        res.status(500).json({ ok: false, message: 'Error al eliminar el bloque.' });
    }
};