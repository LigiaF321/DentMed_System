import React, { useState } from "react";
import "./ForgotPasswordScreen.css";

export default function ResetPasswordScreen({ token, email, onBack, onSuccess }) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const passwordRules = (p) => ({
    min8: p.length >= 8,
    upper: /[A-Z]/.test(p),
    number: /\d/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  });

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!token) return setError("Falta el token. Vuelve a verificar el código.");

    const rules = passwordRules(newPass);
    if (!rules.min8 || !rules.upper || !rules.number || !rules.special) {
      return setError("Debe tener 8+ caracteres, 1 mayúscula, 1 número y 1 especial.");
    }
    if (newPass !== confirmPass) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: newPass,
          confirmPassword: confirmPass,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "No se pudo cambiar la contraseña.");

      setSuccessMsg("Contraseña actualizada correctamente. Redirigiendo al login...");

      // redirección automática al login
      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const rulesNow = passwordRules(newPass);

  return (
    <div className="fp-screen">
      <header className="fp-header">
        <div className="fp-header-left">
          <div className="logo clickable-logo" onClick={() => onBack?.()}>
            <span className="dent-text">Dent</span>
            <span className="med-text">Med</span>
          </div>
        </div>

        <div className="fp-header-right">
          <h1>Sistema de Gestión Dental DentMed</h1>
          <p className="fp-slogan">WORK SPACE BY MILLA&apos;S</p>
        </div>
      </header>

      <main className="fp-main">
        <div className="fp-card">
          <button className="fp-back" type="button" onClick={() => onBack?.()}>
            <i className="fas fa-arrow-left"></i> Volver
          </button>

          <h2 className="fp-title">
            <i className="fas fa-lock"></i> Crear nueva contraseña
          </h2>

          <p className="fp-subtitle">
            Cuenta: <b>{email || "—"}</b>
          </p>

          {error && (
            <div className="fp-hint" style={{ borderLeftColor: "#d33" }}>
              <i className="fas fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="fp-hint">
              <i className="fas fa-circle-check"></i>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="fp-form">
            <label className="fp-label">
              <i className="fas fa-key"></i> Nueva contraseña
            </label>
            <input
              type="password"
              className="fp-input"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Nueva contraseña"
              required
            />

            <div style={{ marginTop: 8, marginBottom: 10, fontSize: 13, lineHeight: "18px" }}>
              <div style={{ opacity: rulesNow.min8 ? 1 : 0.6 }}>• Mínimo 8 caracteres</div>
              <div style={{ opacity: rulesNow.upper ? 1 : 0.6 }}>• 1 mayúscula</div>
              <div style={{ opacity: rulesNow.number ? 1 : 0.6 }}>• 1 número</div>
              <div style={{ opacity: rulesNow.special ? 1 : 0.6 }}>• 1 carácter especial</div>
            </div>

            <label className="fp-label">
              <i className="fas fa-key"></i> Confirmar contraseña
            </label>
            <input
              type="password"
              className="fp-input"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Confirmar contraseña"
              required
            />

            <button type="submit" className="fp-submit" disabled={loading}>
              <i className="fas fa-check"></i> {loading ? "Cambiando..." : "Cambiar contraseña"}
            </button>

            <button type="button" className="fp-submit fp-secondary" onClick={() => onBack?.()}>
              Volver al login
            </button>
          </form>
        </div>
      </main>

      <footer className="fp-footer">
        <p>© 2026 DentMed - Sistema de Gestión Dental</p>
      </footer>
    </div>
  );
}