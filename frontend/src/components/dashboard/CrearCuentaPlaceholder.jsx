import React, { useMemo, useState } from "react";
import "./CrearCuentaPlaceholder.css";

import { createDentistAccount } from "../../services/admin.service";

const ESPECIALIDADES = [
  "Odontología General",
  "Ortodoncia",
  "Endodoncia",
  "Periodoncia",
  "Odontopediatría",
  "Cirugía Oral",
  "Rehabilitación Oral",
  "Estética Dental",
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function onlyDigits(value) {
  return value.replace(/[^\d]/g, "");
}

function genTempPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function CrearCuentaPlaceholder() {
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    colegiado: "",
    especialidad: "",
    direccion: "",
  });

  const [touched, setTouched] = useState({});
  const [tempPassword, setTempPassword] = useState(() => genTempPassword());

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const errors = useMemo(() => {
    const e = {};

    if (!form.nombres.trim()) e.nombres = "Ingresa nombres.";
    if (!form.apellidos.trim()) e.apellidos = "Ingresa apellidos.";

    if (!form.email.trim()) e.email = "Ingresa email.";
    else if (!isValidEmail(form.email)) e.email = "Email inválido.";

    if (!form.telefono.trim()) e.telefono = "Ingresa teléfono.";
    else if (onlyDigits(form.telefono).length < 8) e.telefono = "Teléfono muy corto.";

    if (!form.colegiado.trim()) e.colegiado = "Ingresa número de colegiado.";
    else if (onlyDigits(form.colegiado).length < 4) e.colegiado = "Colegiado inválido.";

    if (!form.especialidad.trim()) e.especialidad = "Selecciona especialidad.";

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  function onChange(e) {
    const { name, value } = e.target;

    if (name === "telefono") {
      setForm((p) => ({ ...p, telefono: onlyDigits(value).slice(0, 12) }));
      return;
    }
    if (name === "colegiado") {
      setForm((p) => ({ ...p, colegiado: onlyDigits(value).slice(0, 12) }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  }

  function onBlur(e) {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
  }

  function handleRegeneratePassword() {
    setTempPassword(genTempPassword());
  }

  async function onSubmit(e) {
    e.preventDefault();

    setTouched({
      nombres: true,
      apellidos: true,
      email: true,
      telefono: true,
      colegiado: true,
      especialidad: true,
      direccion: true,
    });

    setServerError("");
    setSuccessMsg("");

    if (!isValid) return;

    setSubmitting(true);
    try {
      //  EMPAREJADO al backend (NO enviamos tempPassword)
      const payload = {
        nombre: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        especialidad: form.especialidad.trim(),
        licencia: form.colegiado.trim(),
      };

      const res = await createDentistAccount(payload);

      setSuccessMsg(
        res?.message || "✅ Dentista creado exitosamente."
      );

      setForm({
        nombres: "",
        apellidos: "",
        email: "",
        telefono: "",
        colegiado: "",
        especialidad: "",
        direccion: "",
      });
      setTouched({});
      setTempPassword(genTempPassword());
    } catch (err) {
      setServerError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Ocurrió un error al crear la cuenta. Revisa los datos e intenta de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dm-cc-placeholder">
      <div className="dm-cc-icon">
        <i className="fa-solid fa-user-plus" />
      </div>

      <h2 className="dm-cc-title">Crear cuenta de dentista</h2>
      <p className="dm-cc-text">
        Formulario para registrar nuevos dentistas en el sistema.
      </p>

      <form className="dm-cc-form" onSubmit={onSubmit}>
        <div className="dm-cc-field">
          <label className="dm-cc-label">Nombres</label>
          <input
            className="dm-cc-input"
            name="nombres"
            value={form.nombres}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ej: María José"
          />
          {touched.nombres && errors.nombres && (
            <div className="dm-cc-error">{errors.nombres}</div>
          )}
        </div>

        <div className="dm-cc-field">
          <label className="dm-cc-label">Apellidos</label>
          <input
            className="dm-cc-input"
            name="apellidos"
            value={form.apellidos}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ej: Pérez López"
          />
          {touched.apellidos && errors.apellidos && (
            <div className="dm-cc-error">{errors.apellidos}</div>
          )}
        </div>

        <div className="dm-cc-field">
          <label className="dm-cc-label">Email</label>
          <input
            className="dm-cc-input"
            name="email"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ej: dentista@clinica.com"
          />
          {touched.email && errors.email && (
            <div className="dm-cc-error">{errors.email}</div>
          )}
        </div>

        <div className="dm-cc-field">
          <label className="dm-cc-label">Teléfono</label>
          <input
            className="dm-cc-input"
            name="telefono"
            value={form.telefono}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Solo números"
          />
          {touched.telefono && errors.telefono && (
            <div className="dm-cc-error">{errors.telefono}</div>
          )}
        </div>

        <div className="dm-cc-field">
          <label className="dm-cc-label">No. Colegiado</label>
          <input
            className="dm-cc-input"
            name="colegiado"
            value={form.colegiado}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ej: 12345"
          />
          {touched.colegiado && errors.colegiado && (
            <div className="dm-cc-error">{errors.colegiado}</div>
          )}
        </div>

        <div className="dm-cc-field">
          <label className="dm-cc-label">Especialidad</label>
          <select
            className="dm-cc-input"
            name="especialidad"
            value={form.especialidad}
            onChange={onChange}
            onBlur={onBlur}
          >
            <option value="">Selecciona...</option>
            {ESPECIALIDADES.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
          {touched.especialidad && errors.especialidad && (
            <div className="dm-cc-error">{errors.especialidad}</div>
          )}
        </div>

        <div className="dm-cc-field">
          <label className="dm-cc-label">Dirección (opcional)</label>
          <input
            className="dm-cc-input"
            name="direccion"
            value={form.direccion}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ej: Col. Centro, Tegucigalpa"
          />
        </div>

        {/* Sección visual (NO se envía al backend) */}
        <div className="dm-cc-field">
          <label className="dm-cc-label">Contraseña temporal</label>

          <div className="dm-cc-inline">
            <input className="dm-cc-input" value={tempPassword} readOnly />
            <button
              type="button"
              className="dm-cc-btn secondary"
              onClick={handleRegeneratePassword}
            >
              Regenerar
            </button>
          </div>

          <div className="dm-cc-hint">
            (Recomendado: que el backend la genere y la envíe por correo).
          </div>
        </div>

        {serverError && <div className="dm-cc-alert error">{serverError}</div>}
        {successMsg && <div className="dm-cc-alert success">{successMsg}</div>}

        <button
          type="submit"
          className="dm-cc-btn primary"
          disabled={submitting}
        >
          {submitting ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}