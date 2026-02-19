import React, { useState, useEffect } from "react";
import "./LoginScreen.css";

const LoginScreen = ({ onBack, onLoginSuccess }) => {
  const [userType, setUserType] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Simulación de base de datos de doctores (en realidad vendría del backend)
  const TEMPORARY_DOCTOR_CREDENTIALS = {
    "dra.garcia": "TempPass123",
    "dr.martinez": "TempPass456",
    "dra.lopez": "TempPass789",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // VALIDACIÓN 1: Debe seleccionar tipo de usuario
      if (!userType) {
        setError("Por favor seleccione un tipo de usuario");
        return;
      }

      // VALIDACIÓN 2: Credenciales para admin
      if (userType === "admin") {
        if (username !== "Admin" || password !== "Admin123") {
          setError("Credenciales de administrador incorrectas");
          return;
        }

        //  Login exitoso para admin -> ENTRA DIRECTO AL DASHBOARD ADMIN (SIDEBAR)
        if (onLoginSuccess) {
          onLoginSuccess({
            role: "admin",
            requiresPasswordChange: false,
            username: username,
          });
        }
        return;
      }

      // VALIDACIÓN 3: Para doctores
      if (userType === "doctor") {
        if (!username.trim() || !password.trim()) {
          setError("Por favor ingrese sus credenciales asignadas");
          return;
        }

        const storedPassword =
          TEMPORARY_DOCTOR_CREDENTIALS[username.toLowerCase()];

        if (!storedPassword) {
          setError("Usuario no encontrado. Contacte al administrador.");
          return;
        }

        if (password !== storedPassword) {
          setError(
            "Contraseña incorrecta. Contacte al administrador si la olvidó."
          );
          return;
        }

        // ✅ Login exitoso para doctor -> OBLIGATORIO CAMBIAR CONTRASEÑA
        if (onLoginSuccess) {
          onLoginSuccess({
            role: "doctor",
            requiresPasswordChange: true,
            username: username,
          });
        }
        return;
      }
    } catch (err) {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    if (onBack && typeof onBack === "function") {
      onBack();
    }
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setUsername("");
    setPassword("");
    setError("");
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (error && error.includes("incorrect")) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error && error.includes("incorrect")) setError("");
  };

  useEffect(() => {
    if (userType) {
      setUsername("");
      setPassword("");
      setError("");
    }
  }, [userType]);

  return (
    <div className="login-screen">
      <header className="login-header">
        <div className="header-left">
          <div
            className="logo clickable-logo"
            onClick={handleLogoClick}
            style={{ cursor: "pointer" }}
          >
            <span className="dent-text">Dent</span>
            <span className="med-text">Med</span>
          </div>
        </div>
        <div className="header-right">
          <h1>Sistema de Gestión Dental DentMed</h1>
          <p className="slogan">WORKSPACE BY MILLA&apos;S</p>
        </div>
      </header>

      <div className="login-main">
        {/* LADO IZQUIERDO - VISUAL */}
        <div className="login-visual">
          <div className="visual-content">
            <h2>Bienvenido al Sistema de Gestión DentMed</h2>
            <p className="visual-subtitle">
              Acceso exclusivo para personal autorizado
            </p>

            <div className="dental-icon">
              <i className="fas fa-tooth"></i>
              <i className="fas fa-stethoscope"></i>
              <i className="fas fa-user-md"></i>
            </div>

            {/* INFORMACIÓN DINÁMICA */}
            {userType === "admin" && (
              <div className="user-type-info admin-info">
                <h3>
                  <i className="fas fa-user-shield"></i> Modo Administrador
                </h3>
                <p>Acceso completo al sistema</p>
                <p className="security-note">
                  <i className="fas fa-key"></i> Use credenciales maestras iniciales
                </p>
              </div>
            )}

            {userType === "doctor" && (
              <div className="user-type-info doctor-info">
                <h3>
                  <i className="fas fa-user-md"></i> Modo Doctor
                </h3>
                <p>Acceso a historiales y pacientes</p>
                <p className="security-note">
                  <i className="fas fa-key"></i> Use credenciales temporales asignadas
                </p>
              </div>
            )}

            {!userType && (
              <div className="user-type-info default-info">
                <h3>
                  <i className="fas fa-hand-pointer"></i> Seleccione tipo de usuario
                </h3>
                <p>Elija si es Administrador o Doctor</p>
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO - FORMULARIO */}
        <div className="login-form-container">
          <div className="form-header">
            <button
              className="back-button-desktop"
              onClick={handleLogoClick}
              type="button"
            >
              <i className="fas fa-arrow-left"></i> Volver
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="form-title">
              <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
            </h2>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i> {error}
              </div>
            )}

            {/* SELECTOR DE TIPO DE USUARIO */}
            <div className="form-group user-type-group">
              <label className="form-label">
                <i className="fas fa-user-tag"></i> Tipo de Usuario *
              </label>
              <div className="user-type-options">
                <button
                  type="button"
                  className={`user-type-btn ${
                    userType === "admin" ? "selected" : ""
                  }`}
                  onClick={() => handleUserTypeSelect("admin")}
                >
                  <i className="fas fa-user-shield"></i>
                  <span>Administrador(a)</span>
                </button>

                <button
                  type="button"
                  className={`user-type-btn ${
                    userType === "doctor" ? "selected" : ""
                  }`}
                  onClick={() => handleUserTypeSelect("doctor")}
                >
                  <i className="fas fa-user-md"></i>
                  <span>Doctor(a)</span>
                </button>
              </div>
            </div>

            {/* CAMPO USUARIO */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <i className="fas fa-user"></i> Usuario *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={handleUsernameChange}
                placeholder={userType === "admin" ? "Ingrese: Admin" : "Ej: dra.garcia"}
                required
                disabled={!userType}
                className="form-input"
              />
              <div className="input-hint">
                <i className="fas fa-info-circle"></i>
                {userType === "admin"
                  ? "Credenciales maestras: Admin / Admin123"
                  : "Use usuario asignado (ej: dra.garcia)"}
              </div>
            </div>

            {/* CAMPO CONTRASEÑA */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock"></i> Contraseña *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder={
                  userType === "admin"
                    ? "Ingrese: Admin123"
                    : "Contraseña temporal asignada"
                }
                required
                disabled={!userType}
                className="form-input"
              />
              {userType === "doctor" && (
                <div className="input-hint">
                  <i className="fas fa-exclamation-circle"></i>
                  Si no tiene credenciales, contacte al administrador
                </div>
              )}
            </div>

            {/* OPCIONES */}
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={!userType}
                  className="checkbox-input"
                />
                <label htmlFor="remember" className="checkbox-label">
                  Recordar mi sesión
                </label>
              </div>
              <a href="#forgot" className="forgot-password">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* BOTÓN INGRESAR */}
            <button
              type="submit"
              className={`submit-btn ${userType ? "active" : "disabled"}`}
              disabled={isLoading || !userType}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Verificando...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Ingresar al Sistema
                </>
              )}
            </button>

            <div className="security-note">
              <i className="fas fa-shield-alt"></i>
              <span>Sistema seguro - Acceso restringido al personal autorizado</span>
            </div>
          </form>
        </div>
      </div>

      <footer className="login-footer">
        <div className="footer-content">
          <p>© 2024 DentMed - Sistema de Gestión Dental</p>
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
