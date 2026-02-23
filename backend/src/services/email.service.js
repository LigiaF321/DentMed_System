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

// Mantenemos sendDentistCredentialsEmail por si otro archivo lo usa
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
  sendDentistCredentialsEmail
};