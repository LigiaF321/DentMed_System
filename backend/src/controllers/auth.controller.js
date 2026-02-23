const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Usuario = require("../models/Usuario");
const TokenRecuperacion = require("../models/TokenRecuperacion");
const emailService = require("../services/email.service");

const CODE_TTL_MIN = 15;
const TOKEN_TTL_MIN = 15;

function addMinutes(min) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + min);
  return d;
}

function gen6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sha256Hmac(text) {
  const secret = process.env.RESET_TOKEN_SECRET || "dev_secret";
  return crypto.createHmac("sha256", secret).update(text).digest("hex");
}

function isStrongPassword(p) {
  return (
    typeof p === "string" &&
    p.length >= 8 &&
    /[A-Z]/.test(p) &&
    /\d/.test(p) &&
    /[^A-Za-z0-9]/.test(p)
  );
}

// POST /api/auth/forgot-password  { email }
exports.forgotPassword = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();

  // Respuesta genérica (no revelar si existe o no)
  const generic = { message: "Si el correo existe, se enviará un código." };
  if (!email) return res.status(200).json(generic);

  try {
    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(200).json(generic);

    // Opcional: invalidar tokens anteriores NO usados
    await TokenRecuperacion.update(
      { usado: true },
      { where: { id_usuario: user.id, usado: false } }
    );

    const code = gen6DigitCode();
    const codeHash = await bcrypt.hash(code, 10);

    await TokenRecuperacion.create({
      id_usuario: user.id,
      token: codeHash, // guardamos el hash del código
      fecha_expiracion: addMinutes(CODE_TTL_MIN),
      usado: false,
    });

    // Enviar correo (o simular si no hay SMTP)
    if (emailService?.sendPasswordResetCodeEmail) {
      await emailService.sendPasswordResetCodeEmail({ to: email, code });
    } else {
      console.log(`[DEV] Código recuperación para ${email}: ${code}`);
    }

    return res.status(200).json(generic);
  } catch (err) {
    return res.status(200).json(generic);
  }
};

// POST /api/auth/verify-code { email, code } -> { token }
exports.verifyCode = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim();

  if (!email || !code || code.length !== 6) {
    return res.status(400).json({ message: "Código inválido." });
  }

  try {
    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Código inválido o expirado." });

    // Último código no usado
    const codeRow = await TokenRecuperacion.findOne({
      where: { id_usuario: user.id, usado: false },
      order: [["createdAt", "DESC"]],
    });

    if (!codeRow) return res.status(400).json({ message: "Código inválido o expirado." });
    if (new Date(codeRow.fecha_expiracion) < new Date()) {
      return res.status(400).json({ message: "Código inválido o expirado." });
    }

    // token de esta fila es bcrypt(code)
    const ok = await bcrypt.compare(code, codeRow.token);
    if (!ok) return res.status(400).json({ message: "Código inválido o expirado." });

    // Marcar el código como usado (para que sea de un solo uso)
    await codeRow.update({ usado: true });

    // Crear token temporal (plain) y guardar hash en otra fila
    const tokenPlain = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256Hmac(tokenPlain);

    await TokenRecuperacion.create({
      id_usuario: user.id,
      token: tokenHash, // aquí guardamos hash del token temporal
      fecha_expiracion: addMinutes(TOKEN_TTL_MIN),
      usado: false,
    });

    return res.json({ token: tokenPlain, message: "Código verificado." });
  } catch (err) {
    return res.status(500).json({ message: "Error del servidor." });
  }
};

// POST /api/auth/reset-password { token, newPassword, confirmPassword }
exports.resetPassword = async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.newPassword || "");
  const confirmPassword = String(req.body?.confirmPassword || "");

  if (!token) return res.status(400).json({ message: "Token requerido." });
  if (newPassword !== confirmPassword) return res.status(400).json({ message: "No coinciden." });
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message: "Debe tener 8+ caracteres, 1 mayúscula, 1 número y 1 especial.",
    });
  }

  try {
    const tokenHash = sha256Hmac(token);

    // Buscar fila del token temporal
    const tokenRow = await TokenRecuperacion.findOne({
      where: { token: tokenHash, usado: false },
      order: [["createdAt", "DESC"]],
    });

    if (!tokenRow) return res.status(400).json({ message: "Token inválido o expirado." });
    if (new Date(tokenRow.fecha_expiracion) < new Date()) {
      return res.status(400).json({ message: "Token inválido o expirado." });
    }

    const user = await Usuario.findByPk(tokenRow.id_usuario);
    if (!user) return res.status(400).json({ message: "No se pudo actualizar la contraseña." });

    const passHash = await bcrypt.hash(newPassword, 10);

    await user.update({ password_hash: passHash });
    await tokenRow.update({ usado: true });

    return res.json({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    return res.status(500).json({ message: "Error del servidor." });
  }
};