const nodemailer = require("nodemailer");

async function sendDentistCredentialsEmail({ to, tempPassword, nombre }) {
  
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.warn(
      "⚠️ SMTP no configurado. Simulando envío de correo. Credenciales:"
    );
    console.warn({ to, tempPassword, nombre });
    return { simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465, 
    auth: { user, pass },
  });

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

module.exports = { sendDentistCredentialsEmail };
