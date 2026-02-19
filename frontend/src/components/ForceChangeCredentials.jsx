import React, { useMemo, useState } from "react";
import "./ForceChangeCredentials.css";

function strengthScore(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  // (opcional) símbolo suma extra
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) s++;
  return s; // 0..5
}

function strengthLabel(score) {
  if (score <= 2) return "Débil";
  if (score === 3) return "Media";
  return "Fuerte";
}

export default function ForceChangeCredentials({ userData, onSuccess, onBack }) {
  const username = userData?.username || "usuario";

  // En tu login actual NO hay password temporal en userData, así que:
  // - por ahora pedimos que la escriba el usuario (como dice tu tarea).
  // - luego, cuando conectemos backend, validaremos de verdad.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const score = useMemo(() => strengthScore(newPassword), [newPassword]);
  const label = useMemo(() => strengthLabel(score), [score]);

  const rules = useMemo(() => {
    return {
      min8: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      num: /\d/.test(newPassword),
      notSame: currentPassword.length > 0 && newPassword !== currentPassword,
      match: newPassword.length > 0 && newPassword === confirmNew,
      hasCurrent: currentPassword.length > 0,
    };
  }, [newPassword, confirmNew, currentPassword]);

  const allValid = useMemo(() => {
    return (
      rules.hasCurrent &&
      rules.min8 &&
      rules.upper &&
      rules.lower &&
      rules.num &&
      rules.notSame &&
      rules.match
    );
  }, [rules]);

  const errorText = useMemo(() => {
    if (!rules.hasCurrent) return "Ingrese la contraseña actual (temporal).";
    if (!rules.min8) return "La nueva contraseña debe tener mínimo 8 caracteres.";
    if (!rules.upper) return "Debe incluir al menos una mayúscula.";
    if (!rules.lower) return "Debe incluir al menos una minúscula.";
    if (!rules.num) return "Debe incluir al menos un número.";
    if (!rules.notSame) return "La nueva contraseña no puede ser igual a la temporal.";
    if (!rules.match) return "La confirmación no coincide.";
    return "";
  }, [rules]);

  const strengthColor = useMemo(() => {
    if (label === "Débil") return "#ef4444";
    if (label === "Media") return "#f59e0b";
    return "#10b981";
  }, [label]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allValid) return;

    setSubmitting(true);
    try {
      // ✅ FRONTEND listo: luego conectamos backend aquí
      // Por ahora simulamos éxito:
      await new Promise((r) => setTimeout(r, 900));
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="force-change-container">
      <div className="change-header">
        <div className="change-logo">
          <span className="dent-text">Dent</span>
          <span className="med-text">Med</span>
        </div>

        <h1>
          <i className="fas fa-shield-alt"></i> Cambio obligatorio de contraseña
        </h1>
        <p style={{ marginTop: 8, color: "#64748b" }}>
          Por seguridad, debes cambiar tu contraseña en tu primer acceso.
        </p>
      </div>

      <div className="change-card">
        <form onSubmit={handleSubmit} className="change-form">
          {/* Usuario no editable */}
          <div className="form-group">
            <label>
              <i className="fas fa-user"></i> Usuario
            </label>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                fontWeight: 700,
              }}
            >
              {username}
            </div>
          </div>

          {/* Contraseña actual */}
          <div className="form-group">
            <label>
              <i className="fas fa-key"></i> Contraseña actual (temporal) *
            </label>
            <div className="password-input-container">
              <input
                type={show ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese la contraseña temporal"
                required
              />
              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShow((v) => !v)}
              >
                <i className={`fas fa-eye${show ? "-slash" : ""}`}></i>
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> Nueva contraseña *
            </label>
            <input
              type={show ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres, mayúscula, minúscula y número"
              required
            />

            {newPassword && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(score, 5) * 20}%`,
                      background: strengthColor,
                      transition: "width .15s",
                    }}
                  />
                </div>
                <div style={{ marginTop: 6, color: strengthColor, fontWeight: 700 }}>
                  Fortaleza: {label}
                </div>
              </div>
            )}
          </div>

          {/* Confirmar */}
          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> Confirmar nueva contraseña *
            </label>
            <input
              type={show ? "text" : "password"}
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              placeholder="Repita la nueva contraseña"
              required
            />
          </div>

          {/* Mensaje de error específico */}
          {errorText && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errorText}
            </div>
          )}

          {/* Checklist reglas */}
          <div className="security-rules">
            <h4>
              <i className="fas fa-shield-alt"></i> Requisitos:
            </h4>
            <ul>
              <li className={rules.min8 ? "valid" : "invalid"}>
                {rules.min8 ? "✓" : "✗"} Mínimo 8 caracteres
              </li>
              <li className={rules.upper ? "valid" : "invalid"}>
                {rules.upper ? "✓" : "✗"} Al menos una mayúscula
              </li>
              <li className={rules.lower ? "valid" : "invalid"}>
                {rules.lower ? "✓" : "✗"} Al menos una minúscula
              </li>
              <li className={rules.num ? "valid" : "invalid"}>
                {rules.num ? "✓" : "✗"} Al menos un número
              </li>
              <li className={rules.notSame ? "valid" : "invalid"}>
                {rules.notSame ? "✓" : "✗"} No igual a la temporal
              </li>
              <li className={rules.match ? "valid" : "invalid"}>
                {rules.match ? "✓" : "✗"} Confirmación coincide
              </li>
            </ul>
          </div>

          <button type="submit" className="submit-btn" disabled={!allValid || submitting}>
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Cambiando...
              </>
            ) : (
              "Cambiar contraseña e iniciar sesión"
            )}
          </button>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <button type="button" onClick={onBack} style={{ background: "transparent", border: 0, color: "#2563eb", cursor: "pointer", fontWeight: 700 }}>
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}