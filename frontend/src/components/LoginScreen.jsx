import React, { useState } from 'react';
import './LoginScreen.css';

const LoginScreen = ({ onBack }) => {
  const [userType, setUserType] = useState('doctor');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría tu lógica de autenticación
    console.log('Iniciando sesión...');
    alert(`Redirigiendo al dashboard de ${userType}`);
  };

  const handleLogoClick = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="login-screen">
      {/* HEADER SUPERIOR */}
      <header className="login-header">
        <div className="header-left">
          {/* LOGO CLICKEABLE */}
          <div className="logo clickable-logo" onClick={handleLogoClick}>
            <span className="dent-text">Dent</span>
            <span className="med-text">Med</span>
          </div>
        </div>
        <div className="header-right">
          <h1>Sistema de Gestión Dental DentMed</h1>
          <p className="slogan">WORK SPACE BY MILLA'S</p>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="login-main">
        
        {/* LADO IZQUIERDO - VISUAL */}
        <div className="login-visual">
          <div className="visual-content">
            <h2>Bienvenido al Sistema de Gestión DentMed</h2>
            <p className="visual-subtitle">Acceso exclusivo para personal autorizado</p>
            <div className="visual-placeholder">
              <div className="dental-icon">
                <i className="fas fa-tooth"></i>
                <i className="fas fa-stethoscope"></i>
                <i className="fas fa-user-md"></i>
              </div>
              <p>Consultorio Dental Moderno</p>
            </div>
            {/* BOTÓN VOLVER EN VERSIÓN MÓVIL */}
            <button className="back-button-mobile" onClick={handleLogoClick}>
              <i className="fas fa-arrow-left"></i> Volver a Inicio
            </button>
          </div>
        </div>

        {/* LADO DERECHO - FORMULARIO */}
        <div className="login-form-container">
          <div className="form-header">
            <button className="back-button-desktop" onClick={handleLogoClick}>
              <i className="fas fa-arrow-left"></i> Volver
            </button>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="form-title">
              <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
            </h2>

            {/* Campo Usuario */}
            <div className="form-group">
              <label htmlFor="username">
                <i className="fas fa-user"></i> Usuario
              </label>
              <input
                type="text"
                id="username"
                placeholder="ejemplo@dentmed.hn"
                required
              />
            </div>

            {/* Campo Contraseña */}
            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i> Contraseña
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Selector de Tipo de Usuario - SOLO 2 OPCIONES */}
            <div className="form-group">
              <label htmlFor="userType">
                <i className="fas fa-user-tag"></i> Tipo de Usuario
              </label>
              <select 
                id="userType" 
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="user-type-select"
              >
                <option value="admin">Administrador(a)</option>
                <option value="doctor">Doctor(a)</option>
              </select>
            </div>

            {/* Recordar sesión y Olvidé contraseña */}
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember">Recordar mi sesión</label>
              </div>
              <a href="#forgot" className="forgot-password">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón de Ingreso */}
            <button type="submit" className="submit-btn">
              <i className="fas fa-sign-in-alt"></i> Ingresar al Sistema
            </button>

            {/* Mensaje de seguridad */}
            <div className="security-note">
              <i className="fas fa-shield-alt"></i>
              <span>Sistema seguro - Conexión encriptada</span>
            </div>
          </form>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="login-footer">
        <div className="footer-content">
          <p>© 2026 DentMed - Sistema de Gestión Dental</p>
          <p>Versión 1.0</p>
          <p className="access-warning">
            <i className="fas fa-exclamation-triangle"></i>
            Acceso restringido al personal autorizado
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoginScreen;