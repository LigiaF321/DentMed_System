import React, { useState } from "react";
import "./LoginScreen.css";
import logoDentMed from "../assets/dentmed-logo.png";
import { setAuthToken, clearAuthToken } from "../utils/auth";

const LoginScreen = ({ onBack, onLoginSuccess, onForgotPassword }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const guardarSesion = (token, role, extra = {}) => {
    clearAuthToken();
    setAuthToken(token);

    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberMe");
    }

    onLoginSuccess?.({
      role,
      token,
      username,
      ...extra,
    });
  };

  const hacerLoginBackend = async () => {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: username.trim(),
        username: username.trim(),
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Credenciales incorrectas. Intente nuevamente."
      );
    }

    const token = data?.token || data?.data?.token || null;

    if (!token || typeof token !== "string") {
      throw new Error("El servidor no devolvió un token válido.");
    }

    const roleFromApi =
      data?.role ||
      data?.rol ||
      data?.user?.role ||
      data?.user?.rol ||
      data?.data?.role ||
      data?.data?.rol ||
      "admin";

    return {
      token,
      role: roleFromApi,
      data,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!username.trim() || !password.trim()) {
        setError("Por favor ingrese sus credenciales");
        setIsLoading(false);
        return;
      }

      const resultado = await hacerLoginBackend();

      guardarSesion(resultado.token, resultado.role, {
        requiresPasswordChange:
          resultado?.data?.requiresPasswordChange ??
          resultado?.data?.data?.requiresPasswordChange ??
          true,
      });

      setIsLoading(false);
      return;
    } catch (err) {
      console.error("Error en login:", err);
      setError(
        err.message ||
          "Error de conexión con el servidor. Verifique que el backend esté corriendo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    if (onBack && typeof onBack === "function") {
      onBack();
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="login-screen">
      <div className="login-main">
        <div className="login-visual">
          <div className="visual-content">
            <div className="visual-fade">
              <h2>Bienvenido al Sistema de Gestión DentMed</h2>
              <p className="visual-subtitle">
                Acceso exclusivo para personal autorizado
              </p>
              <div className="dental-icon">
                <i className="fas fa-tooth"></i>
                <i className="fas fa-stethoscope"></i>
                <i className="fas fa-user-md"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-container">
          <div className="form-header">
            <div className="login-logo">
              <img src={logoDentMed} alt="DentMed" />
            </div>
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

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <i className="fas fa-user"></i> Usuario *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Usuario o correo"
                required
                className="form-input"
              />
              <div className="input-hint">
                <i className="fas fa-info-circle"></i>
                Ingrese su usuario o correo asignado.
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock"></i> Contraseña *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Ingrese su contraseña"
                  required
                  className="form-input"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
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
              className={`submit-btn ${isLoading ? "disabled" : ""}`}
              disabled={isLoading}
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
              <span>
                Sistema seguro - Acceso restringido al personal autorizado
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;