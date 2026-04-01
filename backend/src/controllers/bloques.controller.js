const { Bloque, Cita } = require('../models');
const { Op } = require('sequelize');

exports.crearBloqueo = async (req, res) => {
  const {
    id_dentista,
    tipo,
    fecha,
    hora_inicio,
    hora_fin,
    recurrencia,
    descripcion,
    dia_completo,
  } = req.body;

  try {
    const inicio = dia_completo
      ? `${fecha} 00:00:00`
      : `${fecha} ${hora_inicio}:00`;

    const fin = dia_completo
      ? `${fecha} 23:59:59`
      : `${fecha} ${hora_fin}:00`;

    const citaSolapada = await Cita.findOne({
      where: {
        id_dentista,
        estado: {
          [Op.notIn]: ['Cancelada', 'cancelada'],
        },
        [Op.or]: [
          { fecha_hora: { [Op.between]: [inicio, fin] } },
          { fecha_hora: inicio },
        ],
      },
    });

    if (citaSolapada) {
      return res.status(400).json({
        ok: false,
        message: 'No se puede bloquear el horario: Ya existe una cita programada en este rango.',
      });
    }

    const nuevoBloque = await Bloque.create({
      id_dentista,
      tipo,
      fecha_inicio: inicio,
      fecha_fin: fin,
      recurrencia: recurrencia || 'ninguna',
      descripcion,
      activo: true,
    });

    return res.status(201).json({
      ok: true,
      message: 'Horario bloqueado con éxito',
      data: nuevoBloque,
    });
  } catch (error) {
    console.error('Error en crearBloqueo:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno al procesar el bloqueo.',
    });
  }
};

exports.obtenerBloques = async (req, res) => {
  const id_dentista = req.params.id_dentista || req.query.id_dentista;

  if (!id_dentista) {
    return res.status(400).json({
      ok: false,
      message: 'El id_dentista es obligatorio.',
    });
  }

  try {
    const bloques = await Bloque.findAll({
      where: {
        id_dentista,
        activo: true,
      },
      order: [['fecha_inicio', 'ASC']],
    });

    return res.json({
      ok: true,
      data: bloques,
    });
  } catch (error) {
    console.error('Error en obtenerBloques:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener los bloques.',
    });
  }
};

exports.eliminarBloque = async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await Bloque.update(
      { activo: false },
      { where: { id } }
    );

    if (resultado[0] === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Bloque no encontrado.',
      });
    }

    return res.json({
      ok: true,
      message: 'Horario desbloqueado correctamente.',
    });
  } catch (error) {
    console.error('Error en eliminarBloque:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al eliminar el bloque.',
    });
  }
};