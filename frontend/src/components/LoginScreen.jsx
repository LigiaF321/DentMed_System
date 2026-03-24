import React, { useState, useEffect } from "react";
import "./LoginScreen.css";

const LoginScreen = ({ onBack, onLoginSuccess, onForgotPassword }) => {
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

        // Login exitoso para admin
        onLoginSuccess?.({
          role: "admin",
          requiresPasswordChange: true,
          username: username,
        });
        return;
      }

      // VALIDACIÓN 3: Para doctores
      if (userType === "doctor") {
        if (!username.trim() || !password.trim()) {
          setError("Por favor ingrese sus credenciales asignadas");
          return;
        }

        const storedPassword = TEMPORARY_DOCTOR_CREDENTIALS[username.toLowerCase()];

        if (!storedPassword) {
          setError("Usuario no encontrado. Contacte al administrador.");
          return;
        }

        if (password !== storedPassword) {
          setError("Contraseña incorrecta. Contacte al administrador si la olvidó.");
          return;
        }

        // Login exitoso para doctor
        onLoginSuccess?.({
          role: "doctor",
          requiresPasswordChange: true,
          username: username,
        });
        return;
      }
    } catch (err) {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeSelect = (type) => {
    if (userType === type) {
      setUserType('');
      setUsername('');
      setPassword('');
      setError('');
      return;
    }
    setUserType(type);
    setUsername('');
    setPassword('');
    setError('');
  };

  // Limpiar error cuando el usuario empieza a escribir
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (error && error.includes('incorrect')) {
      setError('');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error && error.includes('incorrect')) {
      setError('');
    }
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
      {/* DentMed logo removed per user request */}

      <div className="login-main">
        <div className="login-visual">
          <div className="visual-content">
            <div className={`visual-fade${userType === 'doctor' ? ' hide' : ''}`}> 
              <h2>Bienvenido al Sistema de Gestión DentMed</h2>
              <p className="visual-subtitle">Acceso exclusivo para personal autorizado</p>
              <div className="dental-icon">
                <i className="fas fa-tooth"></i>
                <i className="fas fa-stethoscope"></i>
                <i className="fas fa-user-md"></i>
              </div>
            </div>
            <div className={`doctor-instructions-visual${userType === 'doctor' ? ' show' : ''}`}> 
              {userType === 'doctor' && (
                <>
                  <h2><i className="fas fa-user-md"></i> Instrucciones para Doctores</h2>
                  <p><i className="fas fa-check-circle"></i> Use credenciales temporales asignadas</p>
                  <p><i className="fas fa-check-circle"></i> Ejemplo: dra.garcia / TempPass123</p>
                  <p><i className="fas fa-check-circle"></i> Cambie su contraseña en el primer acceso</p>
                  <p className="warning-text">
                    <i className="fas fa-exclamation-triangle"></i>
                    Si no tiene credenciales, contacte al administrador
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="login-form-container">
          <div className="form-header">
            {/* Back button removed - Global logo handles navigation */}
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

            <div className="form-group user-type-group">
              <label className="form-label">
                <i className="fas fa-user-tag"></i> Tipo de Usuario *
              </label>
              <div className="user-type-options">
                <button
                  type="button"
                  className={`user-type-btn ${userType === "admin" ? "selected" : ""}`}
                  onClick={() => handleUserTypeSelect("admin")}
                >
                  <i className="fas fa-user-shield"></i>
                  <span>Administrador(a)</span>
                </button>

                <button
                  type="button"
                  className={`user-type-btn ${userType === "doctor" ? "selected" : ""}`}
                  onClick={() => handleUserTypeSelect("doctor")}
                >
                  <i className="fas fa-user-md"></i>
                  <span>Doctor(a)</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <i className="fas fa-user"></i> Usuario *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={handleUsernameChange}
                placeholder={
                  userType === 'admin' 
                    ? 'Ingrese: Usuario' 
                    : 'Ej: dra.garcia'
                }
                required
                disabled={!userType}
                className="form-input"
              />
              
            </div>

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
                  userType === "admin" ? "Ingrese: Contraseña" : "Contraseña temporal asignada"
                }
                required
                disabled={!userType}
                className="form-input"
              />
              
            </div>
            

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

              <a
                href="#"
                className="forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  onForgotPassword?.();
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

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
    </div>
  );
};

export default LoginScreen;

