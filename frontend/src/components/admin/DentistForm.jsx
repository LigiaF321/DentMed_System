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
  return String(str || "").replace(/\D/g, "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
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
    numero_licencia: "", // ✅ coincide con el nombre que te pidió tu compañera
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ Ya NO ponemos “sin conexión”, solo un hint neutral
  const emailHint = useMemo(() => {
    const email = values.email.trim();
    if (!email) return { type: "neutral", message: "" };
    if (!isValidEmail(email)) return { type: "bad", message: "Formato de email inválido" };
    return { type: "neutral", message: "Se validará al enviar" };
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

    // numero_licencia opcional
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

  // ✅ CLAVE: el botón ya NO depende de ninguna verificación externa
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
      numero_licencia: "",
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
      numero_licencia: true,
    });

    if (!requiredValid) return;

    setSubmitting(true);
    try {
      const tempPassword = generateTempPassword(10);

      // ✅ IMPORTANTE:
      // Tu compañera dijo que el JSON debe llevar:
      // nombres, apellidos, email, especialidad, teléfono, número_licencia
      // OJO: "teléfono" con tilde NO es recomendable en JSON; normalmente backend usa "telefono".
      // Por ahora mando "telefono" y "numero_licencia" (lo más estándar).
      const payload = {
        nombres: values.nombres.trim(),
        apellidos: values.apellidos.trim(),
        email: values.email.trim(),
        especialidad: values.especialidad,
        telefono: onlyDigits(values.telefono),
        numero_licencia: values.numero_licencia.trim() ? values.numero_licencia.trim() : null,

        // Si el backend también necesita password temporal:
        password: tempPassword,
      };

      const data = await createDentist(payload);

      // ✅ devolvemos también credenciales generadas para modal/Success
      onCreated?.({
        ...data,
        credentials: { tempPassword, email: payload.email },
      });

      // opcional: resetear después de crear
      // resetForm();
    } catch (err) {
      alert(err?.message || "No se pudo crear la cuenta. Verifica el backend.");
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
            <div className={`adm-inline ${emailHint.type}`}>
              <i
                className={`fa-solid ${
                  emailHint.type === "bad"
                    ? "fa-circle-xmark"
                    : emailHint.type === "ok"
                    ? "fa-circle-check"
                    : "fa-circle-info"
                }`}
              />{" "}
              {emailHint.message}
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
            value={values.numero_licencia}
            placeholder="Ej: LIC-12345"
            onChange={(e) => updateField("numero_licencia", e.target.value)}
            onBlur={() => markTouched("numero_licencia")}
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
          disabled={submitting}
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
        <i className="fa-solid fa-shield-halved" /> El botón se habilita cuando los campos obligatorios son válidos.
      </div>
    </form>
  );
}