import { useEffect, useMemo, useState } from "react";
import { checkEmailAvailability, createDentist } from "../../services/admin.service";
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
  // Simple y suficiente para frontend
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  // Email check en tiempo real
  const [emailStatus, setEmailStatus] = useState({
    loading: false,
    available: null, // true/false/null
    message: "",
  });

  // Validaciones campo a campo
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

    // licencia opcional (sin validación estricta)
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

  const canSubmit = useMemo(() => {
    // Para enviar, debe estar todo válido y el email debe estar disponible
    return requiredValid && emailStatus.available === true && !submitting;
  }, [requiredValid, emailStatus.available, submitting]);

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
    setEmailStatus({ loading: false, available: null, message: "" });
  }

  // ✅ Email check con debounce (evita spamear al backend)
  useEffect(() => {
    const email = values.email.trim();

    // reset si no hay email o es inválido
    if (!email || !isValidEmail(email)) {
      setEmailStatus({ loading: false, available: null, message: "" });
      return;
    }

    setEmailStatus((s) => ({ ...s, loading: true, message: "Verificando email..." }));

    const timer = setTimeout(async () => {
      try {
        const { ok, data } = await checkEmailAvailability(email);

        // Si backend no existe aún, lo tratamos como "pendiente"
        if (!ok) {
          setEmailStatus({
            loading: false,
            available: null,
            message: "No se pudo verificar ahora (backend pendiente).",
          });
          return;
        }

        if (data?.available === true) {
          setEmailStatus({ loading: false, available: true, message: "Email disponible" });
        } else {
          setEmailStatus({ loading: false, available: false, message: "Este email ya está registrado" });
        }
      } catch (err) {
        setEmailStatus({
          loading: false,
          available: null,
          message: "No se pudo verificar ahora (sin conexión).",
        });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [values.email]);

  async function handleSubmit(e) {
    e.preventDefault();
    // marcar todo touched
    setTouched({
      nombres: true,
      apellidos: true,
      email: true,
      telefono: true,
      especialidad: true,
      licencia: true,
    });

    if (!requiredValid) return;
    if (emailStatus.available !== true) return;

    setSubmitting(true);
    try {
      // Payload esperado por backend (ajústalo si tu backend usa otros nombres)
      const payload = {
        nombres: values.nombres.trim(),
        apellidos: values.apellidos.trim(),
        email: values.email.trim(),
        telefono: onlyDigits(values.telefono),
        especialidad: values.especialidad,
        licencia: values.licencia.trim() ? values.licencia.trim() : null,
      };

      const { ok, status, data } = await createDentist(payload);

      if (!ok) {
        // si email repetido:
        if (status === 409) {
          setEmailStatus({ loading: false, available: false, message: "Este email ya está registrado" });
          return;
        }
        alert(data?.error || "Error al crear la cuenta. Verifique el backend.");
        return;
      }

      // Esperamos que backend devuelva credenciales:
      // data.credentials = { username, tempPassword }
      // data.dentist = { nombreCompleto, email, especialidad }
      onCreated?.(data);

      // No reseteamos aquí: el modal dará opción "crear otra"
    } catch (err) {
      alert("No se pudo conectar con el servidor.");
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

          {/* Estado email */}
          {values.email.trim() && isValidEmail(values.email.trim()) && (
            <div
              className={`adm-inline ${emailStatus.available === true ? "ok" : emailStatus.available === false ? "bad" : "neutral"}`}
            >
              {emailStatus.loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> {emailStatus.message || "Verificando..."}
                </>
              ) : (
                <>
                  <i className={`fa-solid ${emailStatus.available === true ? "fa-circle-check" : emailStatus.available === false ? "fa-circle-xmark" : "fa-circle-info"}`} />
                  {" "}
                  {emailStatus.message}
                </>
              )}
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
              <option key={esp} value={esp}>{esp}</option>
            ))}
          </select>
          {touched.especialidad && errors.especialidad && <div className="adm-error">{errors.especialidad}</div>}
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
        <button type="button" className="adm-btn secondary" onClick={() => { resetForm(); onCancel?.(); }}>
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

      {/* Nota pequeña */}
      <div className="adm-note">
        <i className="fa-solid fa-shield-halved" /> El botón se habilita cuando todos los campos obligatorios son válidos y el email está disponible.
      </div>
    </form>
  );
}
