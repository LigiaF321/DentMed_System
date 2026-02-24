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

async function sendDentistCredentialsEmail({ to, tempPassword, nombre }) {
  const { host, port, user, pass } = getSMTPConfig();

  if (!host || !port || !user || !pass) {
    console.warn("⚠️ SMTP no configurado. Simulando envío de correo. Credenciales:");
    console.warn({ to, tempPassword, nombre });
    return { simulated: true };
  }

  const transporter = createTransporter({ host, port, user, pass });

  const subject = "Credenciales de acceso - DentMed System";
  const text = `Hola ${nombre || ""},

Se ha creado tu cuenta en DentMed System.

Usuario: ${to}
Contraseña temporal: ${tempPassword}

Por favor cambia tu contraseña al iniciar sesión.

Saludos,
Administración DentMed`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text,
  });

  return { simulated: false, messageId: info.messageId };
}

// ✅ NUEVO: enviar código de recuperación (6 dígitos)
async function sendPasswordResetCodeEmail({ to, code }) {
  const { host, port, user, pass } = getSMTPConfig();

  if (!host || !port || !user || !pass) {
    console.warn("⚠️ SMTP no configurado. Simulando envío de correo. Recuperación:");
    console.warn({ to, code });
    return { simulated: true };
  }

  const transporter = createTransporter({ host, port, user, pass });

  const subject = "Código de recuperación - DentMed System";
  const text = `Hola,

Recibimos una solicitud para restablecer tu contraseña en DentMed System.

Tu código de verificación es: ${code}

Este código expira en 15 minutos.
Si tú no solicitaste este cambio, ignora este correo.

Saludos,
DentMed`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    subject,
    text,
  });

  return { simulated: false, messageId: info.messageId };
}

module.exports = {
  sendDentistCredentialsEmail,
  sendPasswordResetCodeEmail,
};