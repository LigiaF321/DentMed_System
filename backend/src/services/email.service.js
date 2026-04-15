const nodemailer = require("nodemailer");

// ========================
// TRANSPORTER SMTP
// ========================
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ========================
// BIENVENIDA DENTISTA
// ========================
async function sendWelcomeDentistEmail({ to, nombres, usuario, password }) {
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Bienvenido a DentMed - Tus Credenciales",
    text: `Hola ${nombres}
Usuario: ${usuario}
Contraseña: ${password}`,
  });

  return { messageId: info.messageId };
}

// ========================
// RESET PASSWORD (CÓDIGO)
// ========================
async function sendPasswordResetCodeEmail({ to, code }) {
  console.log("🔐 PASSWORD RESET CODE:", code, "EMAIL:", to);

  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Código de recuperación - DentMed System",
    html: `
      <div style="font-family: Arial; padding: 20px">
        <h2>Recuperación de contraseña</h2>
        <p>Tu código es:</p>
        <h1 style="font-size: 32px; letter-spacing: 8px; color:#2563eb">
          ${code}
        </h1>
        <p>Expira en 15 minutos.</p>
      </div>
    `,
  });

  console.log("📩 EMAIL ENVIADO:", info.messageId);

  return { messageId: info.messageId };
}

// ========================
// ALERTA SEGURIDAD
// ========================
async function sendSecurityAlertEmail({ to, alerta }) {
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `🚨 ALERTA DE SEGURIDAD - ${alerta.tipo_alerta}`,
    text: `Tipo: ${alerta.tipo_alerta}
Descripción: ${alerta.descripcion}`,
  });

  return { messageId: info.messageId };
}

// ========================
// REPORTE SEMANAL
// ========================
async function sendWeeklySecurityReportEmail({ to, reporte }) {
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "📊 Reporte Semanal de Seguridad - DentMed",
    text: `Resumen:
Críticas: ${reporte.resumen.critica}
Advertencias: ${reporte.resumen.advertencia}
Informativas: ${reporte.resumen.informativa}`,
  });

  return { messageId: info.messageId };
}

// ========================
// EXPORTS
// ========================
module.exports = {
  sendWelcomeDentistEmail,
  sendPasswordResetCodeEmail,
  sendSecurityAlertEmail,
  sendWeeklySecurityReportEmail,
};