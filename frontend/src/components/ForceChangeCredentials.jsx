import React, { useState } from 'react';
import './ForceChangeCredentials.css';

const ForceChangeCredentials = ({ userData, onSuccess, onBack }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateUsername = (username) => {
    if (username.length < 3 || username.length > 20) {
      return 'El usuario debe tener entre 3 y 20 caracteres';
    }
    
    const regex = /^[a-zA-Z0-9_.]+$/;
    if (!regex.test(username)) {
      return 'Solo se permiten letras, números, puntos y guiones bajos';
    }
    
    if (username.toLowerCase() === 'admin') {
      return 'No puede usar "Admin" como nombre de usuario';
    }
    
    return '';
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    
    // Longitud mínima
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    
    // Tiene números
    if (/\d/.test(password)) strength += 1;
    
    // Tiene letras mayúsculas y minúsculas
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    
    // Tiene caracteres especiales
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
    
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    if (!hasNumber || !hasLetter) {
      return 'La contraseña debe contener letras y números';
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    const usernameError = validateUsername(newUsername);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const passwordError = checkPasswordStrength(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // No puede usar las credenciales maestras
    if (newUsername === 'Admin' && newPassword === 'Admin123') {
      setError('No puede usar las credenciales maestras iniciales');
      return;
    }

    // Contraseña débil
    if (passwordStrength < 3) {
      setError('La contraseña es muy débil. Use mayúsculas, minúsculas y números');
      return;
    }

    setIsLoading(true);

    try {
      // Simular llamada al backend
      console.log('Cambiando credenciales para:', userData.role);
      console.log('Nuevo usuario:', newUsername);
      console.log('Nueva contraseña:', newPassword);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Éxito - llamar onSuccess para ir al dashboard
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      setError('Error al cambiar credenciales: ' + error.message);
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Muy débil';
    if (passwordStrength <= 2) return 'Débil';
    if (passwordStrength === 3) return 'Moderada';
    if (passwordStrength === 4) return 'Fuerte';
    return 'Muy fuerte';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444';
    if (passwordStrength === 3) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="force-change-container">
      <div className="change-header">
        <div className="change-logo">
          <span className="dent-text">Dent</span>
          <span className="med-text">Med</span>
        </div>
        <h1>
          <i className="fas fa-shield-alt"></i> 
          {userData.role === 'admin' ? 'Cambio Obligatorio de Credenciales de Administrador' : 'Cambio Obligatorio de Credenciales'}
        </h1>
      </div>

      <div className="change-card">
        <div className="change-alert">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <h3>¡ATENCIÓN {userData.role === 'admin' ? 'ADMINISTRADOR(A)' : 'DOCTOR(A)'}!</h3>
            <p>Por seguridad del sistema, debe cambiar sus credenciales de acceso.</p>
            <p className="alert-detail">
              <strong>Usuario actual:</strong> {userData.username}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="change-form">
          <div className="form-group">
            <label htmlFor="newUsername">
              <i className="fas fa-user"></i> Nuevo Usuario *
            </label>
            <input
              type="text"
              id="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={userData.role === 'admin' ? "Ej: AdminMaria, Director_2024" : "Ej: DraLopez, DrGarcia2024"}
              required
              autoFocus
            />
            <div className="input-hint">
              <i className="fas fa-info-circle"></i>
              3-20 caracteres. Letras (a-z, A-Z), números (0-9), puntos (.) y guiones bajos (_)
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">
              <i className="fas fa-lock"></i> Nueva Contraseña *
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
                placeholder="Mínimo 6 caracteres con letras y números"
                required
              />
              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
            
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill"
                    style={{
                      width: `${passwordStrength * 20}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  ></div>
                </div>
                <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                  Fortaleza: {getPasswordStrengthText()}
                </span>
              </div>
            )}
            
            <div className="input-hint">
              <i className="fas fa-info-circle"></i>
              Recomendado: 8+ caracteres con mayúsculas, minúsculas, números y símbolos
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <i className="fas fa-lock"></i> Confirmar Nueva Contraseña *
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div className="security-rules">
            <h4><i className="fas fa-shield-alt"></i> Reglas de Seguridad Obligatorias:</h4>
            <ul>
              <li className={newUsername.length >= 3 && newUsername.length <= 20 ? 'valid' : 'invalid'}>
                {newUsername.length >= 3 && newUsername.length <= 20 ? '✓' : '✗'} 
                Usuario entre 3 y 20 caracteres
              </li>
              <li className={!/[^a-zA-Z0-9_.]/.test(newUsername) ? 'valid' : 'invalid'}>
                {!/[^a-zA-Z0-9_.]/.test(newUsername) ? '✓' : '✗'} 
                Solo caracteres permitidos
              </li>
              <li className={newPassword.length >= 6 ? 'valid' : 'invalid'}>
                {newPassword.length >= 6 ? '✓' : '✗'} 
                Mínimo 6 caracteres
              </li>
              <li className={/\d/.test(newPassword) && /[a-zA-Z]/.test(newPassword) ? 'valid' : 'invalid'}>
                {/\d/.test(newPassword) && /[a-zA-Z]/.test(newPassword) ? '✓' : '✗'} 
                Letras y números
              </li>
              <li className={newPassword === confirmPassword && newPassword !== '' ? 'valid' : 'invalid'}>
                {newPassword === confirmPassword && newPassword !== '' ? '✓' : '✗'} 
                Contraseñas coinciden
              </li>
            </ul>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Cambiando credenciales...
              </>
            ) : (
              <>
                <i className="fas fa-check-circle"></i> Guardar Nuevas Credenciales
              </>
            )}
          </button>

          <div className="final-notes">
            <p className="warning-note">
              <i className="fas fa-exclamation-triangle"></i>
              <strong>IMPORTANTE:</strong> Estas credenciales serán definitivas. Guárdelas en un lugar seguro.
            </p>
            <p className="info-note">
              <i className="fas fa-info-circle"></i>
              Después de este cambio, podrá acceder al sistema con sus nuevas credenciales.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForceChangeCredentials;