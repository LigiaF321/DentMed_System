// backend/src/controllers/pacientes.controller.js
const { Op, fn, col } = require('sequelize');
const { Paciente, Cita, BusquedaPacienteDentista } = require('../models');

const hasPacienteField = (field) => Boolean(Paciente.rawAttributes?.[field]);

const obtenerDentistaIdDesdeRequest = (req) => {
  const usuario = req.usuario || req.user || req.auth || null;
  if (!usuario) return null;
  return usuario.id_dentista || usuario.dentista_id || usuario.id || null;
};

const parseFiltros = (value) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const fnac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - fnac.getFullYear();
  const m = hoy.getMonth() - fnac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fnac.getDate())) edad--;
  return edad;
};

const normalizarListaTexto = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).join(', ');
  }
  if (value === undefined || value === null) return null;
  const texto = String(value).trim();
  return texto || null;
};

const buscarPacientes = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const offset = (page - 1) * limit;
    const filtros = parseFiltros(req.query.filtros_json);

    const wherePaciente = {};
    const orConditions = [];

    if (q) {
      orConditions.push({ nombre: { [Op.like]: `%${q}%` } });

      if (hasPacienteField('apellido')) {
        orConditions.push({ apellido: { [Op.like]: `%${q}%` } });
      }

      if (hasPacienteField('telefono')) {
        orConditions.push({ telefono: { [Op.like]: `%${q}%` } });
      }

      if (hasPacienteField('documento')) {
        orConditions.push({ documento: { [Op.like]: `%${q}%` } });
      }

      if (hasPacienteField('email')) {
        orConditions.push({ email: { [Op.like]: `%${q}%` } });
      }

      wherePaciente[Op.or] = orConditions;
    }

    if (hasPacienteField('activo') && filtros.activo !== '' && filtros.activo !== undefined) {
      wherePaciente.activo = String(filtros.activo) === 'true';
    }

    if (hasPacienteField('fecha_nacimiento')) {
      if (filtros.edad_min || filtros.edad_max) {
        wherePaciente.fecha_nacimiento = {};

        const hoy = new Date();

        if (filtros.edad_min) {
          const maxFechaNacimiento = new Date(hoy);
          maxFechaNacimiento.setFullYear(hoy.getFullYear() - Number(filtros.edad_min));
          wherePaciente.fecha_nacimiento[Op.lte] = maxFechaNacimiento;
        }

        if (filtros.edad_max) {
          const minFechaNacimiento = new Date(hoy);
          minFechaNacimiento.setFullYear(hoy.getFullYear() - Number(filtros.edad_max) - 1);
          minFechaNacimiento.setDate(minFechaNacimiento.getDate() + 1);
          wherePaciente.fecha_nacimiento[Op.gte] = minFechaNacimiento;
        }
      }
    }

    const filtrarPorCitas =
      filtros.id_dentista ||
      filtros.fecha_ultima_visita_desde ||
      filtros.fecha_ultima_visita_hasta;

    if (filtrarPorCitas) {
      const whereCitas = {};

      if (filtros.id_dentista) {
        whereCitas.id_dentista = Number(filtros.id_dentista);
      }

      if (filtros.fecha_ultima_visita_desde || filtros.fecha_ultima_visita_hasta) {
        whereCitas.fecha_hora = {};
        if (filtros.fecha_ultima_visita_desde) {
          whereCitas.fecha_hora[Op.gte] = new Date(`${filtros.fecha_ultima_visita_desde}T00:00:00`);
        }
        if (filtros.fecha_ultima_visita_hasta) {
          whereCitas.fecha_hora[Op.lte] = new Date(`${filtros.fecha_ultima_visita_hasta}T23:59:59`);
        }
      }

      const citas = await Cita.findAll({
        attributes: ['id_paciente'],
        where: whereCitas,
        group: ['id_paciente'],
        raw: true,
      });

      const idsPacientes = citas.map((c) => c.id_paciente);

      if (!idsPacientes.length) {
        return res.status(200).json({
          ok: true,
          data: [],
          page,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      wherePaciente.id = { [Op.in]: idsPacientes };
    }

    const { count, rows } = await Paciente.findAndCountAll({
      where: wherePaciente,
      order: [['nombre', 'ASC']],
      limit,
      offset,
    });

    const ids = rows.map((p) => p.id);

    let ultimaVisitaMap = {};
    if (ids.length) {
      const ultimas = await Cita.findAll({
        attributes: ['id_paciente', [fn('MAX', col('fecha_hora')), 'ultima_visita']],
        where: {
          id_paciente: {
            [Op.in]: ids,
          },
        },
        group: ['id_paciente'],
        raw: true,
      });

      ultimaVisitaMap = ultimas.reduce((acc, item) => {
        acc[item.id_paciente] = item.ultima_visita;
        return acc;
      }, {});
    }

    const data = rows.map((p) => {
      const plain = p.get({ plain: true });

      const nombreCompleto = hasPacienteField('apellido')
        ? `${plain.nombre || ''} ${plain.apellido || ''}`.trim()
        : plain.nombre;

      return {
        ...plain,
        nombre_completo: nombreCompleto,
        edad: hasPacienteField('fecha_nacimiento') ? calcularEdad(plain.fecha_nacimiento) : null,
        ultima_visita: ultimaVisitaMap[plain.id] || null,
        activo_texto: hasPacienteField('activo')
          ? plain.activo
            ? 'Activo'
            : 'Inactivo'
          : '-',
      };
    });

    return res.status(200).json({
      ok: true,
      data,
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al buscar pacientes',
    });
  }
};

const obtenerPacienteDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const fromSearch = String(req.query.from_search || '0') === '1';

    const paciente = await Paciente.findByPk(id);

    if (!paciente) {
      return res.status(404).json({
        ok: false,
        message: 'Paciente no encontrado',
      });
    }

    const citas = await Cita.findAll({
      where: { id_paciente: id },
      order: [['fecha_hora', 'DESC']],
      limit: 20,
      raw: true,
    });

    const plain = paciente.get({ plain: true });
    
    let odontograma = {};
    
    console.log('🔍 [GET] Valor raw del odontograma en BD:', plain.odontograma);
    
    if (plain.odontograma) {
      try {
        // Si es string, parsearlo
        if (typeof plain.odontograma === 'string') {
          // Intentar parsear como JSON
          odontograma = JSON.parse(plain.odontograma);
          console.log('✅ [GET] Odontograma parseado correctamente:', odontograma);
        } else {
          odontograma = plain.odontograma;
        }
      } catch (error) {
        console.error('❌ [GET] Error parseando odontograma:', error);
        // Intentar corregir si falta llaves
        if (typeof plain.odontograma === 'string' && plain.odontograma && !plain.odontograma.startsWith('{')) {
          try {
            odontograma = JSON.parse('{' + plain.odontograma + '}');
            console.log('✅ [GET] Odontograma corregido (agregando llaves):', odontograma);
          } catch (e2) {
            odontograma = {};
          }
        } else {
          odontograma = {};
        }
      }
    } else {
      console.log('⚠️ [GET] No hay odontograma en BD');
    }
    
    console.log('📤 [GET] Odontograma final a enviar:', odontograma);

    const data = {
      ...plain,
      odontograma: odontograma,
      nombre_completo: hasPacienteField('apellido')
        ? `${plain.nombre || ''} ${plain.apellido || ''}`.trim()
        : plain.nombre,
      edad: hasPacienteField('fecha_nacimiento') ? calcularEdad(plain.fecha_nacimiento) : null,
      citas,
    };

    if (fromSearch && BusquedaPacienteDentista) {
      const idDentista = obtenerDentistaIdDesdeRequest(req);

      if (idDentista) {
        const existing = await BusquedaPacienteDentista.findOne({
          where: {
            id_dentista: idDentista,
            id_paciente: id,
          },
        });

        if (existing) {
          await existing.update({
            total_busquedas: Number(existing.total_busquedas || 0) + 1,
            ultima_busqueda: new Date(),
          });
        } else {
          await BusquedaPacienteDentista.create({
            id_dentista: idDentista,
            id_paciente: id,
            total_busquedas: 1,
            ultima_busqueda: new Date(),
          });
        }
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener detalle del paciente:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener detalle del paciente',
    });
  }
};

const obtenerPacientesRecientes = async (req, res) => {
  try {
    if (!BusquedaPacienteDentista) {
      return res.status(200).json({ ok: true, ids: [] });
    }

    const idDentista = obtenerDentistaIdDesdeRequest(req);

    if (!idDentista) {
      return res.status(200).json({ ok: true, ids: [] });
    }

    const rows = await BusquedaPacienteDentista.findAll({
      where: { id_dentista: idDentista },
      attributes: ['id_paciente', 'total_busquedas', 'ultima_busqueda'],
      order: [
        ['total_busquedas', 'DESC'],
        ['ultima_busqueda', 'DESC'],
      ],
      limit: 5,
      raw: true,
    });

    return res.status(200).json({
      ok: true,
      ids: rows.map((row) => row.id_paciente),
    });
  } catch (error) {
    console.error('Error al obtener pacientes recientes:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener pacientes recientes',
    });
  }
};

const crearPacienteRapido = async (req, res) => {
  try {
    const {
      nombre,
      nombre_completo,
      email,
      telefono,
      direccion,
      fecha_nacimiento,
      alergias,
      sexo,
      seguro_medico,
      contacto_emergencia,
      telefono_emergencia,
    } = req.body;

    const nombreFinal = String(nombre || nombre_completo || '').trim();
    if (!nombreFinal) {
      return res.status(400).json({
        ok: false,
        message: 'El nombre del paciente es obligatorio',
      });
    }

    const nuevoPaciente = await Paciente.create({
      nombre: nombreFinal,
      email: email || null,
      telefono: telefono || null,
      direccion: direccion || null,
      fecha_nacimiento: fecha_nacimiento || null,
      alergias: normalizarListaTexto(alergias),
      sexo: sexo || null,
      seguro_medico: seguro_medico || null,
      contacto_emergencia: contacto_emergencia || null,
      telefono_emergencia: telefono_emergencia || null,
    });

    return res.status(201).json({
      ok: true,
      message: 'Paciente creado correctamente',
      data: {
        id: nuevoPaciente.id,
        nombre: nuevoPaciente.nombre,
        telefono: nuevoPaciente.telefono || '',
        email: nuevoPaciente.email || '',
      },
    });
  } catch (error) {
    console.error('Error al crear paciente rápido:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear paciente',
    });
  }
};

// Endpoint: PUT /api/pacientes/:id/odontograma
const actualizarOdontograma = async (req, res) => {
  try {
    console.log('📥 [ODONTOGRAMA] Body recibido:', req.body);
    
    const { id } = req.params;

    const estados = req.body.estados || req.body.odontograma;
    
    console.log('📥 [ODONTOGRAMA] Estados a guardar:', estados);

    if (!estados) {
      console.log('❌ [ODONTOGRAMA] No se recibieron estados');
      return res.status(400).json({
        ok: false,
        message: 'No se recibieron datos de odontograma. Envía { "estados": {...} }'
      });
    }

    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      console.log(`❌ [ODONTOGRAMA] Paciente ${id} no encontrado`);
      return res.status(404).json({
        ok: false,
        message: 'Paciente no encontrado'
      });
    }

    const odontogramaString = JSON.stringify(estados);
    await paciente.update({ odontograma: odontogramaString });

    const pacienteActualizado = await Paciente.findByPk(id);
    console.log('[ODONTOGRAMA] Odontograma guardado en BD:', pacienteActualizado.odontograma);

    return res.status(200).json({
      message: 'Odontograma actualizado correctamente',
      odontograma: estados
    });
  } catch (error) {
    console.error(' [ODONTOGRAMA] Error al guardar odontograma:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al guardar odontograma: ' + error.message
    });
  }
};

// ✅ Actualizar datos generales del paciente
const actualizarDatosPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      nombre_completo,
      email,
      telefono,
      direccion,
      fecha_nacimiento,
      alergias,
      sexo,
      seguro_medico,
      contacto_emergencia,
      telefono_emergencia,
    } = req.body;

    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      return res.status(404).json({
        ok: false,
        message: 'Paciente no encontrado'
      });
    }

    // Actualizar solo los campos que se proporcionen
    const datosActualizar = {};

    const nombreNormalizado = nombre !== undefined ? nombre : nombre_completo;
    if (nombreNormalizado !== undefined && hasPacienteField('nombre')) {
      datosActualizar.nombre = String(nombreNormalizado || '').trim();
    }

    if (email !== undefined) datosActualizar.email = email;
    if (telefono !== undefined) datosActualizar.telefono = telefono;
    if (direccion !== undefined) datosActualizar.direccion = direccion;
    if (fecha_nacimiento !== undefined && hasPacienteField('fecha_nacimiento')) {
      datosActualizar.fecha_nacimiento = fecha_nacimiento || null;
    }
    if (alergias !== undefined && hasPacienteField('alergias')) {
      datosActualizar.alergias = normalizarListaTexto(alergias);
    }
    if (sexo !== undefined && hasPacienteField('sexo')) {
      datosActualizar.sexo = sexo || null;
    }
    if (seguro_medico !== undefined && hasPacienteField('seguro_medico')) {
      datosActualizar.seguro_medico = seguro_medico || null;
    }
    if (contacto_emergencia !== undefined && hasPacienteField('contacto_emergencia')) {
      datosActualizar.contacto_emergencia = contacto_emergencia || null;
    }
    if (telefono_emergencia !== undefined && hasPacienteField('telefono_emergencia')) {
      datosActualizar.telefono_emergencia = telefono_emergencia || null;
    }

    if (!Object.keys(datosActualizar).length) {
      return res.status(400).json({
        ok: false,
        message: 'No se recibieron campos válidos para actualizar el paciente'
      });
    }

    await paciente.update(datosActualizar);
    await paciente.reload();

    return res.status(200).json({
      ok: true,
      message: 'Paciente actualizado correctamente',
      data: {
        ...paciente.get({ plain: true }),
        nombre_completo: paciente.nombre,
        edad: hasPacienteField('fecha_nacimiento') ? calcularEdad(paciente.fecha_nacimiento) : null,
      }
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar paciente: ' + error.message
    });
  }
};

module.exports = {
  buscarPacientes,
  obtenerPacienteDetalle,
  obtenerPacientesRecientes,
  crearPacienteRapido,
  actualizarOdontograma,
  actualizarDatosPaciente,
};
