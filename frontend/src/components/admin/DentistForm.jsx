import { useMemo, useState } from "react";
import { createDentist } from "../../services/admin.service";
import "./admin.css";

const ESPECIALIDADES = [
  "Odontología General",
  "Ortodoncia",
  "Endodoncia",
  "Periodoncia",
  "Cirugía Oral",
  "Odontopediatría",
  "Estética Dental",
];

function onlyDigits(str) {
  return str.replace(/\D/g, "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateTempPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function DentistForm({ onCreated, onCancel }) {
  const [values, setValues] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    especialidad: "",
    licencia: "",
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  //  Mensaje fijo (backend no tiene endpoint de verificación)
  const emailStatus = useMemo(() => {
    const email = values.email.trim();
    if (!email) return { type: "neutral", message: "" };
    if (!isValidEmail(email)) return { type: "bad", message: "Formato de email inválido" };
    return { type: "neutral", message: "Se validará al enviar el formulario" };
  }, [values.email]);

  const errors = useMemo(() => {
    const e = {};

    if (!values.nombres.trim()) e.nombres = "Nombres es obligatorio.";
    else if (values.nombres.trim().length > 50) e.nombres = "Máximo 50 caracteres.";

    if (!values.apellidos.trim()) e.apellidos = "Apellidos es obligatorio.";
    else if (values.apellidos.trim().length > 50) e.apellidos = "Máximo 50 caracteres.";

    if (!values.email.trim()) e.email = "Email es obligatorio.";
    else if (!isValidEmail(values.email.trim())) e.email = "Formato de email inválido.";

    if (!values.telefono.trim()) e.telefono = "Teléfono es obligatorio.";
    else {
      const digits = onlyDigits(values.telefono);
      if (digits.length < 8 || digits.length > 10) e.telefono = "Debe tener 8 a 10 dígitos.";
    }

    if (!values.especialidad) e.especialidad = "Especialidad es obligatoria.";

    return e;
  }, [values]);

  const phoneDigits = useMemo(() => onlyDigits(values.telefono), [values.telefono]);

  const phoneValid = useMemo(() => {
    const len = phoneDigits.length;
    return len >= 8 && len <= 10;
  }, [phoneDigits]);

  const requiredValid = useMemo(() => {
    return (
      !errors.nombres &&
      !errors.apellidos &&
      !errors.email &&
      !errors.telefono &&
      !errors.especialidad
    );
  }, [errors]);

  //  Ahora el botón SOLO depende de validaciones locales
  const canSubmit = useMemo(() => requiredValid && !submitting, [requiredValid, submitting]);

  function updateField(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function markTouched(name) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  function resetForm() {
    setValues({
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      especialidad: "",
      licencia: "",
    });
    setTouched({});
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setTouched({
      nombres: true,
      apellidos: true,
      email: true,
      telefono: true,
      especialidad: true,
      licencia: true,
    });

    if (!requiredValid) return;

    setSubmitting(true);
    try {
      const tempPassword = generateTempPassword(10);

      //  Payload adaptado a lo que backend espera
      const payload = {
        nombre: `${values.nombres.trim()} ${values.apellidos.trim()}`,
        especialidad: values.especialidad,
        telefono: onlyDigits(values.telefono),
        email: values.email.trim(),
        password: tempPassword,
      };

      const data = await createDentist(payload);

      //  Devuelve también la contraseña temporal para mostrarla en modal o consola
      onCreated?.({ ...data, credentials: { tempPassword, email: payload.email } });

      // opcional: reset y cerrar
      // resetForm();
    } catch (err) {
      alert(err?.message || "No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="adm-form" onSubmit={handleSubmit}>
      <div className="adm-grid">
        <div className="adm-field">
          <label>Nombres *</label>
          <input
            value={values.nombres}
            maxLength={50}
            placeholder="Ej: Juan Carlos"
            onChange={(e) => updateField("nombres", e.target.value)}
            onBlur={() => markTouched("nombres")}
          />
          {touched.nombres && errors.nombres && <div className="adm-error">{errors.nombres}</div>}
        </div>

        <div className="adm-field">
          <label>Apellidos *</label>
          <input
            value={values.apellidos}
            maxLength={50}
            placeholder="Ej: Pérez García"
            onChange={(e) => updateField("apellidos", e.target.value)}
            onBlur={() => markTouched("apellidos")}
          />
          {touched.apellidos && errors.apellidos && <div className="adm-error">{errors.apellidos}</div>}
        </div>

        <div className="adm-field">
          <label>Email *</label>
          <input
            type="email"
            value={values.email}
            placeholder="Ej: juan.perez@email.com"
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => markTouched("email")}
          />

          {values.email.trim() && (
            <div className={`adm-inline ${emailStatus.type}`}>
              <i
                className={`fa-solid ${
                  emailStatus.type === "bad"
                    ? "fa-circle-xmark"
                    : emailStatus.type === "ok"
                    ? "fa-circle-check"
                    : "fa-circle-info"
                }`}
              />{" "}
              {emailStatus.message}
            </div>
          )}

          {touched.email && errors.email && <div className="adm-error">{errors.email}</div>}
        </div>

        <div className="adm-field">
          <label>Teléfono *</label>
          <input
            inputMode="numeric"
            value={values.telefono}
            placeholder="Ej: 5551234567"
            onChange={(e) => updateField("telefono", onlyDigits(e.target.value))}
            onBlur={() => markTouched("telefono")}
          />
          <div className={`adm-inline ${phoneValid ? "ok" : "bad"}`}>
            <i className={`fa-solid ${phoneValid ? "fa-circle-check" : "fa-circle-xmark"}`} />{" "}
            {phoneValid ? "Teléfono válido" : "Debe tener 8 a 10 dígitos"}
          </div>
          {touched.telefono && errors.telefono && <div className="adm-error">{errors.telefono}</div>}
        </div>

        <div className="adm-field">
          <label>Especialidad *</label>
          <select
            value={values.especialidad}
            onChange={(e) => updateField("especialidad", e.target.value)}
            onBlur={() => markTouched("especialidad")}
          >
            <option value="">Seleccione una opción</option>
            {ESPECIALIDADES.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
          {touched.especialidad && errors.especialidad && (
            <div className="adm-error">{errors.especialidad}</div>
          )}
        </div>

        <div className="adm-field">
          <label>Número de licencia (opcional)</label>
          <input
            value={values.licencia}
            placeholder="Ej: LIC-12345"
            onChange={(e) => updateField("licencia", e.target.value)}
          />
        </div>
      </div>

      <div className="adm-actions">
        <button
          type="button"
          className="adm-btn secondary"
          onClick={() => {
            resetForm();
            onCancel?.();
          }}
        >
          Cancelar
        </button>

        <button type="submit" className="adm-btn primary" disabled={!canSubmit}>
          {submitting ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Creando...
            </>
          ) : (
            "Crear cuenta"
          )}
        </button>
      </div>

      <div className="adm-note">
        <i className="fa-solid fa-shield-halved" /> Se validan campos en frontend; el servidor valida al enviar.
      </div>
    </form>
  );
}