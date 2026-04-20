const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const Usuario = require("../models/Usuario");
const TokenRecuperacion = require("../models/TokenRecuperacion");
const { AlertaSeguridad, IntentosFallidos } = require("../models");
const alertasSeguridadService = require("../services/alertasSeguridad.service");
const emailService = require("../services/email.service");
const { Dentista, Auditoria } = require("../models"); 
const { Op } = require("sequelize");

const CODE_TTL_MIN = 15;
const TOKEN_TTL_MIN = 15;

// --- FUNCIONES DE TUS COMPAÑEROS (SIN MODIFICAR) ---

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

exports.forgotPassword = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const generic = { message: "Si el correo existe, se enviará un código." };
  if (!email) return res.status(200).json(generic);
  try {
    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(200).json(generic);
    await TokenRecuperacion.update(
      { usado: true },
      { where: { id_usuario: user.id, usado: false } }
    );
    const code = gen6DigitCode();
    const codeHash = await bcrypt.hash(code, 10);
    await TokenRecuperacion.create({
      id_usuario: user.id,
      token: codeHash,
      fecha_expiracion: addMinutes(CODE_TTL_MIN),
      usado: false,
    });
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

exports.verifyCode = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim();
  if (!email || !code || code.length !== 6) {
    return res.status(400).json({ message: "Código inválido." });
  }
  try {
    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Código inválido o expirado." });
    const codeRow = await TokenRecuperacion.findOne({
      where: { id_usuario: user.id, usado: false },
      order: [["createdAt", "DESC"]],
    });
    if (!codeRow) return res.status(400).json({ message: "Código inválido o expirado." });
    if (new Date(codeRow.fecha_expiracion) < new Date()) {
      return res.status(400).json({ message: "Código inválido o expirado." });
    }
    const ok = await bcrypt.compare(code, codeRow.token);
    if (!ok) return res.status(400).json({ message: "Código inválido o expirado." });
    await codeRow.update({ usado: true });
    const tokenPlain = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256Hmac(tokenPlain);
    await TokenRecuperacion.create({
      id_usuario: user.id,
      token: tokenHash,
      fecha_expiracion: addMinutes(TOKEN_TTL_MIN),
      usado: false,
    });
    return res.json({ token: tokenPlain, message: "Código verificado." });
  } catch (err) {
    return res.status(500).json({ message: "Error del servidor." });
  }
};

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

// --- TAREAS DE ALEJANDRA (DM02) ---

const limpiarParaUsuario = (texto) => {
    if (!texto) return "";
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
};

exports.validarEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: "Email requerido" });
        const existe = await Usuario.findOne({ where: { email } });
        return res.json({ disponible: !existe });
    } catch (error) {
        return res.status(500).json({ message: "Error al validar email" });
    }
};

exports.crearDentista = async (req, res) => {
    try {
        const { nombres, apellidos, email, telefono, especialidad, numero_licencia, adminId } = req.body;
        
        if (!nombres || !apellidos || !email || !especialidad) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const emailExiste = await Usuario.findOne({ where: { email } });
        if (emailExiste) return res.status(400).json({ message: "El email ya está registrado" });

        const base = `${limpiarParaUsuario(nombres.split(' ')[0])}.${limpiarParaUsuario(apellidos.split(' ')[0])}`;
        let usuarioFinal = base;
        let contador = 1;
        while (await Usuario.findOne({ where: { username: usuarioFinal } })) {
            usuarioFinal = `${base}${contador}`;
            contador++;
        }
        
        const passwordTemporal = crypto.randomBytes(6).toString('base64').slice(0, 10); 
        const salt = await bcrypt.genSalt(10);
        const passHash = await bcrypt.hash(passwordTemporal, salt);
        
        const nuevoUsuario = await Usuario.create({ 
            username: usuarioFinal, 
            email, 
            password_hash: passHash, 
            rol: "dentista", 
            primer_acceso: true, 
            activo: true 
        });
        
        await Dentista.create({ 
            id_usuario: nuevoUsuario.id, 
            nombre: nombres, 
            apellidos: apellidos, 
            especialidad, 
            telefono, 
            email, 
            numero_licencia: numero_licencia || "S/N"
        });
        
        await Auditoria.create({ 
            id_usuario: adminId || 1, 
            accion: "CREAR_DENTISTA", 
            detalle: `Cuenta creada para: ${nombres} ${apellidos}`, 
            ip: req.ip || "127.0.0.1"
        });
        
        if (emailService?.sendWelcomeDentistEmail) {
            try {
                await emailService.sendWelcomeDentistEmail({ 
                    to: email, 
                    nombres, 
                    usuario: usuarioFinal, 
                    password: passwordTemporal 
                });
            } catch (mailErr) {
                console.error("Error envío email:", mailErr.message);
            }
        }

        return res.status(201).json({ message: "Éxito", usuario: usuarioFinal });
    } catch (error) {
        return res.status(500).json({ message: "Error", error: error.message });
    }
};

// Tarea 4.1: Login
exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const ident = String(email || username || "").trim();

    if (!ident || !password) {
      return res.status(400).json({ message: "Credenciales incompletas" });
    }

    const user = await Usuario.findOne({
      where: {
        [Op.or]: [{ email: ident }, { username: ident }],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      const usuarioIntentado = ident;

      await IntentosFallidos.create({
        ip: ip,
        usuario_intentado: usuarioIntentado,
      });

      const diezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
      const intentosRecientes = await IntentosFallidos.findAll({
        where: {
          ip: ip,
          fecha_intento: { [Op.gte]: diezMinutosAtras },
        },
      });

      if (intentosRecientes.length >= 5) {
        await alertasSeguridadService.generarAlertaIntentosFallidos(
          ip,
          intentosRecientes
        );
      }

      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const ahora = new Date();
    const hora = ahora.getHours();
    const diaSemana = ahora.getDay();

    const horaInicio = 8;
    const horaFin = 20;
    const diasLaborables = [1, 2, 3, 4, 5];

    if (diasLaborables.includes(diaSemana) && (hora < horaInicio || hora >= horaFin)) {
      await alertasSeguridadService.generarAlertaAccesoFueraHorario(user, hora);
    }

    const secret = process.env.JWT_SECRET || "secreto_desarrollo";

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      secret,
      { expiresIn: "24h" }
    );

    return res.json({
      token,
      requiresPasswordChange: user.primer_acceso,
      user: {
        id: user.id,
        rol: user.rol,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error en login" });
  }
};

// Tarea 5.1: Cambio de contraseña
exports.forceChangePassword = async (req, res) => {
    try {
        const { usuarioId, nuevaPassword, confirmPassword } = req.body;
        if (nuevaPassword !== confirmPassword) return res.status(400).json({ message: "No coinciden" });
        const passHash = await bcrypt.hash(nuevaPassword, 10);
        await Usuario.update({ password_hash: passHash, primer_acceso: false }, { where: { id: usuarioId } }); 
        return res.json({ message: "Éxito" });
    } catch (error) {
        return res.status(500).json({ message: "Error" });
    }
};

// Tarea 6.1: Dashboard Médico
exports.getMedicoDashboard = async (req, res) => {
    try {
        const { usuarioId } = req.query;
        const dentista = await Dentista.findOne({ 
            where: { id_usuario: usuarioId },
            include: [{ model: Usuario, attributes: ['email'] }]
        });

        if (!dentista) return res.status(404).json({ message: "Perfil no encontrado" });
        
        return res.json({ 
            nombreCompleto: `${dentista.nombre || ""} ${dentista.apellidos || ""}`.trim(), 
            especialidad: dentista.especialidad, 
            email: dentista.email || (dentista.Usuario ? dentista.Usuario.email : "Sin correo"), 
            telefono: dentista.telefono, 
            proximasCitas: [] 
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al cargar dashboard" });
    }
};