import React, { useState, useEffect } from 'react';
import './LoginScreen.css';

const LoginScreen = ({ onBack, onLoginSuccess }) => {
  const [userType, setUserType] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const MASTER_CREDENTIALS = {
    admin: {
      username: 'Admin',
      password: 'Admin123'
    }
  };

  const isValidUsername = (username) => {
    const regex = /^[a-zA-Z0-9_.]{3,20}$/;
    return regex.test(username);
  };

  const isValidPassword = (password) => {
    return password.length >= 6 && /\d/.test(password) && /[a-zA-Z]/.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!userType) {
      setError('⚠️ Por favor, seleccione un tipo de usuario');
      setIsLoading(false);
      return;
    }

    if (!username.trim()) {
      setError('⚠️ El nombre de usuario es requerido');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('⚠️ La contraseña es requerida');
      setIsLoading(false);
      return;
    }

    if (!isValidUsername(username)) {
      setError('⚠️ El usuario debe contener solo letras, números, puntos y guiones bajos (3-20 caracteres)');
      setIsLoading(false);
      return;
    }

    if (!isValidPassword(password)) {
      setError('⚠️ La contraseña debe tener al menos 6 caracteres, letras y números');
      setIsLoading(false);
      return;
    }

    try {
      if (userType === 'admin') {
        if (username === MASTER_CREDENTIALS.admin.username && 
            password === MASTER_CREDENTIALS.admin.password) {
          onLoginSuccess({
            id: 1,
            username: username,
            userType: 'admin',
            fullName: 'Administrador Principal',
            needsChange: true
          });
          return;
        } else {
          setError('❌ Credenciales incorrectas para administrador');
          setIsLoading(false);
          return;
        }
      }

      if (userType === 'doctor') {
        setError('❌ Credenciales incorrectas. Contacte al administrador para obtener acceso');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError('❌ Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    if (onBack) onBack();
  };

  useEffect(() => {
    if (userType === '') {
      setUsername('');
      setPassword('');
      setError('');
    }
  }, [userType]);

  return (
    <div className="login-screen">
      <header className="login-header">
        <div className="header-left">
          <div className="logo clickable-logo" onClick={handleLogoClick}>
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
              
              {userType === 'admin' ? (
                <div className="user-type-info admin-info">
                  <h3><i className="fas fa-user-shield"></i> Modo Administrador</h3>
                  <p>Acceso completo al sistema</p>
                  <p className="security-note">
                    <i className="fas fa-key"></i> Credenciales maestras iniciales
                  </p>
                  <p className="credentials-display">
                    Usuario: <strong>Admin</strong><br/>
                    Contraseña: <strong>Admin123</strong>
                  </p>
                </div>
              ) : userType === 'doctor' ? (
                <div className="user-type-info doctor-info">
                  <h3><i className="fas fa-user-md"></i> Modo Doctor</h3>
                  <p>Acceso a historiales y pacientes</p>
                  <p className="security-note">
                    <i className="fas fa-key"></i> Credenciales asignadas por admin
                  </p>
                </div>
              ) : (
                <div className="user-type-info default-info">
                  <h3><i className="fas fa-hand-pointer"></i> Seleccione tipo de usuario</h3>
                  <p>Elija si es Administrador o Doctor</p>
                </div>
              )}
            </div>
          </div>
        </div>

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
                  className={`user-type-btn ${userType === 'admin' ? 'selected' : ''}`}
                  onClick={() => setUserType('admin')}
                >
                  <i className="fas fa-user-shield"></i>
                  <span>Administrador(a)</span>
                </button>
                
                <button
                  type="button"
                  className={`user-type-btn ${userType === 'doctor' ? 'selected' : ''}`}
                  onClick={() => setUserType('doctor')}
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
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: Admin, DraGarcia2024, User_123"
                required
                disabled={!userType}
                className="form-input"
              />
              <div className="input-hint">
                <i className="fas fa-info-circle"></i>
                Solo letras, números, puntos y guiones bajos (3-20 caracteres)
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock"></i> Contraseña *
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!userType}
                  className="form-input"
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
              <div className="input-hint">
                <i className="fas fa-info-circle"></i>
                Mínimo 6 caracteres, letras y números
              </div>
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
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${userType ? 'active' : 'disabled'}`}
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

            <div className="special-instructions">
              {userType === 'admin' && (
                <div className="admin-instructions">
                  <h4><i className="fas fa-key"></i> Credenciales Maestras Iniciales</h4>
                  <div className="credentials-box">
                    <div className="credential-item">
                      <span className="credential-label">Usuario:</span>
                      <span className="credential-value">Admin</span>
                    </div>
                    <div className="credential-item">
                      <span className="credential-label">Contraseña:</span>
                      <span className="credential-value">Admin123</span>
                    </div>
                  </div>
                  <p className="warning-text">
                    <i className="fas fa-exclamation-triangle"></i>
                    <strong>IMPORTANTE:</strong> Deberá cambiar estas credenciales después del primer acceso
                  </p>
                </div>
              )}
              
              {userType === 'doctor' && (
                <div className="doctor-instructions">
                  <h4><i className="fas fa-info-circle"></i> Instrucciones para Doctores</h4>
                  <p><i className="fas fa-check-circle"></i> Use las credenciales asignadas por el administrador</p>
                  <p><i className="fas fa-check-circle"></i> Contacte al administrador si no tiene credenciales</p>
                  <p><i className="fas fa-check-circle"></i> Deberá cambiar sus credenciales en el primer acceso</p>
                </div>
              )}
            </div>

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
