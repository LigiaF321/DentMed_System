import React, { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ForceChangeCredentials from "./components/ForceChangeCredentials"; // Asegúrate de tener este componente
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome");
  const [currentUser, setCurrentUser] = useState(null); // Para guardar datos del usuario logueado
  
  const handleLoginSuccess = (userData) => {
    // Guardar datos del usuario
    setCurrentUser(userData);
    
    // SIEMPRE redirigir a cambio de contraseña en el primer acceso
    // (tanto admin como doctores deben cambiar credenciales)
    setScreen("forceChange");
  };
  
  const handlePasswordChangeComplete = () => {
    // Después de cambiar contraseña, ir al dashboard
    setScreen("dashboard");
  };
  
  const handleLogout = () => {
    // Limpiar datos y volver a welcome
    setCurrentUser(null);
    setScreen("welcome");
  };

  return (
    <div className="App">
      {/* PANTALLA DE BIENVENIDA */}
      {screen === "welcome" && (
        <WelcomeScreen onEnter={() => setScreen("login")} />
      )}
      
      {/* PANTALLA DE LOGIN */}
      {screen === "login" && (
        <LoginScreen 
          onBack={() => setScreen("welcome")} // ← Esto hace funcionar logo y botón "Volver"
          onLoginSuccess={handleLoginSuccess} // ← Recibe datos del usuario
          onForgotPassword={() => setScreen("forgot")}
        />
      )}
      
      {/* CAMBIO OBLIGATORIO DE CREDENCIALES */}
      {screen === "forceChange" && currentUser && (
        <ForceChangeCredentials
          userData={currentUser}
          onSuccess={handlePasswordChangeComplete}
          onBack={() => {
            // Si cancela, volver al login
            setCurrentUser(null);
            setScreen("login");
          }}
        />
      )}
      
      {/* RECUPERACIÓN DE CONTRASEÑA */}
      {screen === "forgot" && (
        <ForgotPasswordScreen onBack={() => setScreen("login")} />
      )}
      
      {/* DASHBOARD PRINCIPAL */}
      {screen === "dashboard" && (
        <DashboardScreen 
          userData={currentUser} // Pasar datos del usuario al dashboard
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;