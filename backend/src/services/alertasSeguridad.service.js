const { AlertaSeguridad, IntentosFallidos, Usuario } = require("../models");
const { Op } = require("sequelize");
const emailService = require("./email.service");

// WebSocket io instance (se configurará en app.js)
// let io;

class AlertasSeguridadService {
  // Emitir notificación en tiempo real
  static emitirNotificacion(alerta) {
    // if (io) {
    //   io.emit('nueva-alerta-seguridad', {
    //     id: alerta.id,
    //     tipo: alerta.tipo_alerta,
    //     prioridad: alerta.prioridad,
    //     descripcion: alerta.descripcion,
    //     fecha: alerta.fecha_alerta
    //   });
    // }
  }

  // Generar alerta por intentos fallidos múltiples
  static async generarAlertaIntentosFallidos(ip, intentosRecientes) {
    const usuarios = [...new Set(intentosRecientes.map(i => i.usuario_intentado))];
    const alerta = await AlertaSeguridad.create({
      tipo_alerta: 'intentos_fallidos',
      prioridad: 'critica',
      descripcion: `${intentosRecientes.length} intentos fallidos desde IP ${ip} en 10 minutos`,
      ip_origen: ip,
      metadatos: { usuarios: usuarios, total: intentosRecientes.length }
    });

    // Enviar email por alerta crítica
    await this.enviarEmailAlertaCritica(alerta);

    // Emitir notificación en tiempo real
    this.emitirNotificacion(alerta);

    return alerta;
  }

  // Enviar email por alerta crítica
  static async enviarEmailAlertaCritica(alerta) {
    try {
      // Obtener emails de administradores (por ahora hardcodeado, luego de config)
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@dentmed.com'];

      for (const email of adminEmails) {
        await emailService.sendSecurityAlertEmail({
          to: email.trim(),
          alerta: alerta
        });
      }
    } catch (error) {
      console.error('Error enviando email de alerta crítica:', error);
    }
  }
  // Enviar email de reporte semanal
  static async enviarEmailReporteSemanal(reporte) {
    try {
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@dentmed.com'];

      for (const email of adminEmails) {
        await emailService.sendWeeklySecurityReportEmail({
          to: email.trim(),
          reporte: reporte
        });
      }
    } catch (error) {
      console.error('Error enviando email de reporte semanal:', error);
    }
  }

  // Generar alerta por acceso fuera de horario
  static async generarAlertaAccesoFueraHorario(usuario, hora) {
    const alerta = await AlertaSeguridad.create({
      tipo_alerta: 'acceso_fuera_horario',
      prioridad: 'advertencia',
      descripcion: `Usuario ${usuario.nombre || usuario.email} accedió fuera de horario (${hora}:00)`,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre || usuario.email,
      metadatos: { hora_acceso: hora, horario_normal: '8-20' }
    });

    this.emitirNotificacion(alerta);
    return alerta;
  }

  // Generar alerta por cuenta bloqueada
  static async generarAlertaCuentaBloqueada(usuario, intentos) {
    await AlertaSeguridad.create({
      tipo_alerta: 'cuenta_bloqueada',
      prioridad: 'advertencia',
      descripcion: `Cuenta ${usuario.nombre || usuario.email} bloqueada por ${intentos} intentos fallidos`,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre || usuario.email,
      metadatos: { intentos: intentos, duracion: '24 horas' }
    });
  }

  // Generar alerta por IP sospechosa
  static async generarAlertaIPSospechosa(ip, usuariosIntentados) {
    await AlertaSeguridad.create({
      tipo_alerta: 'ip_sospechosa',
      prioridad: 'advertencia',
      descripcion: `IP ${ip} intentó acceder a ${usuariosIntentados.length} usuarios diferentes`,
      ip_origen: ip,
      metadatos: { usuarios: usuariosIntentados }
    });
  }

  // Generar alerta por nuevo dispositivo
  static async generarAlertaNuevoDispositivo(usuario, ip, userAgent) {
    await AlertaSeguridad.create({
      tipo_alerta: 'nuevo_dispositivo',
      prioridad: 'informativa',
      descripcion: `Usuario ${usuario.nombre || usuario.email} accedió desde nuevo dispositivo`,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre || usuario.email,
      metadatos: { ip: ip, user_agent: userAgent }
    });
  }

  // Generar alerta por cambio de clave inusual
  static async generarAlertaCambioClaveInusual(usuario, cambios) {
    await AlertaSeguridad.create({
      tipo_alerta: 'cambio_clave_inusual',
      prioridad: 'advertencia',
      descripcion: `Usuario ${usuario.nombre || usuario.email} realizó ${cambios} cambios de contraseña en 1 hora`,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre || usuario.email,
      metadatos: { cambios: cambios, periodo: '1 hora' }
    });
  }

  // Verificar y reactivar alertas silenciadas expiradas
  static async reactivarAlertasExpiradas() {
    const ahora = new Date();
    const alertasExpiradas = await AlertaSeguridad.findAll({
      where: {
        estado: 'silenciada',
        silenciada_hasta: { [Op.lt]: ahora, [Op.ne]: null }
      }
    });

    for (const alerta of alertasExpiradas) {
      await alerta.update({ estado: 'activa' });
      // Registrar en auditoría si es necesario
    }

    return alertasExpiradas.length;
  }

  // Generar reporte semanal
  static async generarReporteSemanal() {
    const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const alertas = await AlertaSeguridad.findAll({
      where: { fecha_alerta: { [Op.gte]: semanaAtras } },
      attributes: [
        'prioridad',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['prioridad']
    });

    const resumen = { critica: 0, advertencia: 0, informativa: 0 };
    alertas.forEach(a => {
      resumen[a.prioridad] = parseInt(a.dataValues.count);
    });

    const principalesEventos = await AlertaSeguridad.findAll({
      where: { fecha_alerta: { [Op.gte]: semanaAtras } },
      order: [['fecha_alerta', 'DESC']],
      limit: 5
    });

    const reporte = { resumen, principalesEventos };

    // Enviar email semanal
    await this.enviarEmailReporteSemanal(reporte);

    return reporte;
  }
}

module.exports = AlertasSeguridadService;