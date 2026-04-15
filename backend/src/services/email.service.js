const nodemailer = require("nodemailer");

// ========================
// TRANSPORTER SMTP
// ========================
function createTransporter() {
  const port = Number(process.env.SMTP_PORT);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: port === 465,
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

  try {
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

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (error) {
    console.error("❌ ERROR AL ENVIAR EMAIL:");
    console.error("CODE:", error.code);
    console.error("MESSAGE:", error.message);
    console.error("FULL:", error);

    return {
      success: false,
      error: error.message,
    };
  }
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