import React, { useState } from 'react';
import "./ForgotPasswordScreen.css";
import './ForgotPasswordScreen.css';

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Por seguridad, no confirmamos si el correo existe o no.
    setSent(true);

    // Cuando conectes backend, aquí harás fetch POST /auth/forgot-password
    // console.log("Recovery email:", email);
  };

  return (
    <div className="fp-screen">
      {/* Header superior (mismo estilo DentMed) */}
      <header className="fp-header">
        <div className="fp-header-left">
          <div
            className="logo clickable-logo"
            onClick={() => onBack && onBack()}
          >
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
          <button
            className="fp-back"
            type="button"
            onClick={() => onBack && onBack()}
          >
            <i className="fas fa-arrow-left"></i> Volver
          </button>

          <h2 className="fp-title">
            <i className="fas fa-key"></i> Recuperación de contraseña
          </h2>
          <p className="fp-subtitle">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contraseña.
          </p>

          {!sent ? (
            <form onSubmit={handleSubmit} className="fp-form">
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
                <span>
                  Por seguridad, no confirmamos si el correo existe en el
                  sistema.
                </span>
              </div>

              <button type="submit" className="fp-submit">
                <i className="fas fa-paper-plane"></i> Enviar enlace
              </button>
            </form>
          ) : (
            <div className="fp-success">
              <div className="fp-success-ico">
                <i className="fas fa-circle-check"></i>
              </div>
              <div>
                <div className="fp-success-title">Solicitud enviada</div>
                <div className="fp-success-text">
                  Si el correo está registrado, recibirás un enlace de
                  recuperación en unos minutos.
                </div>
              </div>

              <button
                className="fp-submit fp-secondary"
                type="button"
                onClick={() => onBack && onBack()}
              >
                Volver al login
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="fp-footer">
        <p>© 2026 DentMed - Sistema de Gestión Dental</p>
      </footer>
    </div>
  );
}
