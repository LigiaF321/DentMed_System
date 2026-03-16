const nodemailer = require("nodemailer");

function getSMTPConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return { host, port, user, pass };
}

function createTransporter({ host, port, user, pass }) {
  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

// ✅ Función DM02: Bienvenida al Dentista
async function sendWelcomeDentistEmail({ to, nombres, usuario, password }) {
  const { host, port, user, pass } = getSMTPConfig();
  if (!host || !port || !user || !pass) {
    console.warn("⚠️ SMTP no configurado. Simulando envío de bienvenida.");
    return { simulated: true };
  }
  const transporter = createTransporter({ host, port, user, pass });
  const subject = "Bienvenido a DentMed - Tus Credenciales";
  const text = `Hola ${nombres},
Tu cuenta ha sido creada con éxito.
Usuario: ${usuario}
Contraseña temporal: ${password}
Por seguridad, cambia tu contraseña al ingresar.`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text,
  });
  return { simulated: false, messageId: info.messageId };
}

// ✅ Función: Recuperación (compañeros)
async function sendPasswordResetCodeEmail({ to, code }) {
  const { host, port, user, pass } = getSMTPConfig();
  if (!host || !port || !user || !pass) {
    console.warn("⚠️ SMTP no configurado. Simulando recuperación.");
    return { simulated: true };
  }
  const transporter = createTransporter({ host, port, user, pass });
  const subject = "Código de recuperación - DentMed System";
  const text = `Tu código de verificación es: ${code}\nExpira en 15 minutos.`;
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text,
  });
  return { simulated: false, messageId: info.messageId };
}

// ✅ Función: Alerta de Seguridad Crítica
async function sendSecurityAlertEmail({ to, alerta }) {
  const { host, port, user, pass } = getSMTPConfig();
  if (!host || !port || !user || !pass) {
    console.warn("⚠️ SMTP no configurado. Simulando envío de alerta crítica.");
    return { simulated: true };
  }
  const transporter = createTransporter({ host, port, user, pass });
  const subject = `🚨 ALERTA DE SEGURIDAD CRÍTICA - ${alerta.tipo_alerta.replace('_', ' ').toUpperCase()}`;
  const text = `ALERTA DE SEGURIDAD CRÍTICA

Tipo: ${alerta.tipo_alerta.replace('_', ' ').toUpperCase()}
Descripción: ${alerta.descripcion}
Fecha: ${new Date(alerta.fecha_alerta).toLocaleString('es-ES')}
${alerta.ip_origen ? `IP Origen: ${alerta.ip_origen}` : ''}
${alerta.usuario_nombre ? `Usuario: ${alerta.usuario_nombre}` : ''}

Esta es una notificación automática del sistema de monitoreo de seguridad.
Por favor, revise el panel de administración inmediatamente.`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text,
  });
  return { simulated: false, messageId: info.messageId };
}

// ✅ Función: Reporte Semanal de Seguridad
async function sendWeeklySecurityReportEmail({ to, reporte }) {
  const { host, port, user, pass } = getSMTPConfig();
  if (!host || !port || !user || !pass) {
    console.warn("⚠️ SMTP no configurado. Simulando envío de reporte semanal.");
    return { simulated: true };
  }
  const transporter = createTransporter({ host, port, user, pass });
  const subject = `📊 Reporte Semanal de Seguridad - DentMed System`;
  const text = `REPORTE SEMANAL DE SEGURIDAD
Semana del ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')} al ${new Date().toLocaleDateString('es-ES')}

RESUMEN:
• Total de alertas: ${reporte.resumen.critica + reporte.resumen.advertencia + reporte.resumen.informativa}
• Críticas: ${reporte.resumen.critica}
• Advertencias: ${reporte.resumen.advertencia}
• Informativas: ${reporte.resumen.informativa}

PRINCIPALES EVENTOS:
${reporte.principalesEventos.map(evento => `• ${evento.descripcion}`).join('\n')}

Este es un reporte automático generado por el sistema de monitoreo de seguridad.`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text,
  });
  return { simulated: false, messageId: info.messageId };
}

// ✅ Función: Credenciales de Dentista (mantenida por compatibilidad)
async function sendDentistCredentialsEmail({ to, tempPassword, nombre }) {
  const { host, port, user, pass } = getSMTPConfig();
  if (!host || !port || !user || !pass) return { simulated: true };
  const transporter = createTransporter({ host, port, user, pass });
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject: "Credenciales de acceso",
    text: `Hola ${nombre}, Usuario: ${to}, Clave: ${tempPassword}`,
  });
  return { simulated: false, messageId: info.messageId };
}

module.exports = {
  sendWelcomeDentistEmail,
  sendPasswordResetCodeEmail,
  sendDentistCredentialsEmail,
  sendSecurityAlertEmail,
  sendWeeklySecurityReportEmail
};