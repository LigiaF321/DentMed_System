import React, { useEffect, useState } from "react";
import "./ForgotPasswordScreen.css";

export default function ForgotPasswordScreen({ onBack, onVerified }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearMsgs = () => {
    setError("");
    setSuccessMsg("");
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSendCode = async (e) => {
    e.preventDefault();
    clearMsgs();

    const eTrim = email.trim().toLowerCase();
    if (!isValidEmail(eTrim)) {
      setError("Correo inválido. Revisa el formato.");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: eTrim }),
      });

      setSuccessMsg(
        "Si el correo está registrado, recibirás un código de verificación en unos minutos."
      );
      setStep(2);
      setCooldown(60);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    clearMsgs();
    if (cooldown > 0) return;

    const eTrim = email.trim().toLowerCase();
    if (!isValidEmail(eTrim)) {
      setError("Primero escribe un correo válido.");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: eTrim }),
      });

      setSuccessMsg("Código reenviado. Revisa tu correo.");
      setCooldown(60);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    clearMsgs();

    const eTrim = email.trim().toLowerCase();
    const cTrim = code.trim();

    if (cTrim.length !== 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: eTrim, code: cTrim }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Código inválido o expirado.");

      if (!data?.token) throw new Error("No se recibió token del servidor.");

      // “PESTAÑA/PANTALLA”
      onVerified?.({ token: data.token, email: eTrim });
    } catch (err) {
      setError(err.message || "Código inválido o expirado.");
    } finally {
      setLoading(false);
    }
  };

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
            <i className="fas fa-key"></i> Recuperación de contraseña
          </h2>

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

          {step === 1 && (
            <>
              <p className="fp-subtitle">
                Ingresa tu correo y te enviaremos un <b>código</b>.
              </p>

              <form onSubmit={handleSendCode} className="fp-form">
                <label className="fp-label" htmlFor="fpEmail">
                  <i className="fas fa-envelope"></i> Correo electrónico
                </label>
                <input
                  id="fpEmail"
                  type="email"
                  className="fp-input"
                  placeholder="ejemplo@dentmed.hn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="fp-hint">
                  <i className="fas fa-shield-alt"></i>
                  <span>Por seguridad, no confirmamos si el correo existe en el sistema.</span>
                </div>

                <button type="submit" className="fp-submit" disabled={loading}>
                  <i className="fas fa-paper-plane"></i> {loading ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <p className="fp-subtitle">
                Escribe el código de <b>6 dígitos</b> enviado a: <b>{email.trim()}</b>
              </p>

              <form onSubmit={handleVerifyCode} className="fp-form">
                <label className="fp-label" htmlFor="fpCode">
                  <i className="fas fa-hashtag"></i> Código
                </label>
                <input
                  id="fpCode"
                  className="fp-input"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />

                <button type="submit" className="fp-submit" disabled={loading}>
                  <i className="fas fa-check"></i> {loading ? "Verificando..." : "Verificar"}
                </button>

                <button
                  type="button"
                  className="fp-submit fp-secondary"
                  onClick={handleResendCode}
                  disabled={loading || cooldown > 0}
                >
                  <i className="fas fa-rotate-right"></i>{" "}
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
                </button>

                <button
                  type="button"
                  className="fp-submit fp-secondary"
                  onClick={() => {
                    clearMsgs();
                    setCode("");
                    setStep(1);
                  }}
                  disabled={loading}
                >
                  Cambiar correo
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="fp-footer">
        <p>© 2026 DentMed - Sistema de Gestión Dental</p>
      </footer>
    </div>
  );
}