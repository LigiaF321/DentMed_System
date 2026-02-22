const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { Usuario, Dentista, Auditoria } = require("../models");
const { Op } = require("sequelize");

/**
 * 3.1 Configuración de Email (Tarea 3.1)
 */
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "tu-correo@gmail.com", 
        pass: "tu-password-de-aplicacion" 
    }
});

/**
 * Funciones Auxiliares
 */
const isStrongPassword = (p) => (p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p));

const limpiarParaUsuario = (texto) => {
    if (!texto) return "";
    return texto.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Tarea 2.2
        .replace(/\s+/g, '') 
        .replace(/[^a-z0-9]/g, '');
};

// --- 1. VALIDAR EMAIL (Tarea 1.1) ---
exports.validarEmail = async (req, res) => {
    try {
        const { email } = req.query;
        const existe = await Usuario.findOne({ where: { email } });
        res.json({ disponible: !existe });
    } catch (error) {
        res.status(500).json({ message: "Error al validar email" });
    }
};

// --- 2. CREAR DENTISTA (Tarea 2 completa) ---
exports.crearDentista = async (req, res) => {
    try {
        const { nombres, apellidos, email, telefono, especialidad, numero_licencia, adminId } = req.body;

        // Generación de usuario único (Tarea 2.2)
        const base = `${limpiarParaUsuario(nombres.split(' ')[0])}.${limpiarParaUsuario(apellidos.split(' ')[0])}`;
        let usuarioFinal = base;
        let contador = 1;
        while (await Usuario.findOne({ where: { username: usuarioFinal } })) {
            contador++;
            usuarioFinal = `${base}${contador}`;
        }

        const passwordTemporal = "DentMed2026!"; 
        const passHash = await bcrypt.hash(passwordTemporal, 10);

        // Registro en USUARIOS (Tarea 2.3)
        const nuevoUsuario = await Usuario.create({
            username: usuarioFinal,
            email: email,
            password_hash: passHash,
            rol: "dentista",
            primer_acceso: true,
            activo: true
        });

        // Registro en DENTISTAS (Tarea 2.3)
        await Dentista.create({
            id_usuario: nuevoUsuario.id,
            nombre: nombres, // Ajustado a tu columna 'nombre'
            apellidos: apellidos,
            especialidad: especialidad,
            telefono: telefono,
            email: email,
            numero_licencia: numero_licencia || null
        });

        // Auditoría (Tarea 2.4)
        // Usamos 'detalles' y 'fecha_hora' como en tu imagen
        await Auditoria.create({
            id_usuario: adminId || 1,
            accion: "CREAR_DENTISTA",
            detalles: `Cuenta creada: ${usuarioFinal} (${email})`, 
            ip: req.ip || "127.0.0.1",
            fecha_hora: new Date() 
        });

        // Envío de Email (Tarea 3.3)
        const mailOptions = {
            to: email,
            subject: 'Bienvenido a DentMed - Credenciales Temporales',
            html: `<p>Usuario: <b>${usuarioFinal}</b></p><p>Contraseña: <b>${passwordTemporal}</b></p>`
        };
        transporter.sendMail(mailOptions).catch(e => console.log("Error mail"));

        res.status(201).json({ message: "Éxito", usuario: usuarioFinal, passwordTemporal });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

// --- 4. LOGIN (Tarea 4.1) ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Búsqueda por email o username (Tarea 4.1)
        const user = await Usuario.findOne({ where: { [Op.or]: [{ email }, { username: email }] } });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        const requiereCambio = user.primer_acceso === true || user.primer_acceso === 1;

        const token = jwt.sign(
            { id: user.id, rol: user.rol, requiereCambio }, 
            "SECRETO_DENTMED", 
            { expiresIn: '8h' }
        );

        res.json({ token, requiereCambio, user: { id: user.id, rol: user.rol } });
    } catch (error) {
        res.status(500).json({ message: "Error en login" });
    }
};

// --- 5. CAMBIO DE CONTRASEÑA OBLIGATORIO (Tarea 5.1) ---
exports.forceChangePassword = async (req, res) => {
    try {
        const { usuarioId, nuevaPassword, confirmPassword } = req.body;

        if (nuevaPassword !== confirmPassword) return res.status(400).json({ message: "No coinciden" });
        if (!isStrongPassword(nuevaPassword)) return res.status(400).json({ message: "Contraseña débil" });

        const passHash = await bcrypt.hash(nuevaPassword, 10);
        await Usuario.update({ password_hash: passHash, primer_acceso: false }, { where: { id: usuarioId } }); 

        await Auditoria.create({
            id_usuario: usuarioId,
            accion: "CAMBIO_PASSWORD_OBLIGATORIO",
            detalles: "Primer cambio realizado exitosamente",
            ip: req.ip,
            fecha_hora: new Date()
        });

        res.json({ message: "Contraseña actualizada" });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar password" });
    }
};

// --- 6. DASHBOARD DE MÉDICO (Tarea 6.1) ---
exports.getMedicoDashboard = async (req, res) => {
    try {
        const { usuarioId } = req.query;
        const dentista = await Dentista.findOne({
            where: { id_usuario: usuarioId }
        });

        res.json({
            nombreCompleto: `${dentista.nombre} ${dentista.apellidos}`,
            especialidad: dentista.especialidad,
            email: dentista.email,
            telefono: dentista.telefono,
            proximasCitas: [] // Tarea 6.1
        });
    } catch (error) {
        res.status(500).json({ message: "Error al cargar dashboard" });
    }
};