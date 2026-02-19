import React, { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ForceChangeCredentials from "./components/ForceChangeCredentials";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome");
  const [currentUser, setCurrentUser] = useState(null);

  const goTo = (next) => setScreen(next);

  const handleLoginSuccess = (userData) => {
    console.log("LOGIN OK =>", userData);

    // Evitar “pantalla en blanco” si LoginScreen no manda datos
    if (!userData) {
      console.error(
        "onLoginSuccess fue llamado sin userData. Revisa LoginScreen: debe llamar onLoginSuccess(userData)."
      );
      setCurrentUser(null);
      goTo("login");
      return;
    }

    setCurrentUser(userData);

    // Decide si forzar cambio de contraseña
    const mustChange =
      userData.mustChangePassword === true ||
      userData.forcePasswordChange === true ||
      userData.firstLogin === true;

    if (mustChange) {
      goTo("forceChange");
    } else {
      goTo("dashboard");
    }
  };

  const handlePasswordChangeComplete = () => {
    goTo("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    goTo("welcome");
  };

  const handleBackToLogin = () => {
    setCurrentUser(null);
    goTo("login");
  };

  return (
    <div className="App">
      {/* PANTALLA DE BIENVENIDA */}
      {screen === "welcome" && (
        <WelcomeScreen onEnter={() => goTo("login")} />
      )}

      {/* PANTALLA DE LOGIN */}
      {screen === "login" && (
        <LoginScreen
          onBack={() => goTo("welcome")}
          onLoginSuccess={handleLoginSuccess}
          onForgotPassword={() => goTo("forgot")}
        />
      )}

      {/* RECUPERACIÓN DE CONTRASEÑA */}
      {screen === "forgot" && (
        <ForgotPasswordScreen onBack={() => goTo("login")} />
      )}

      {/* CAMBIO OBLIGATORIO DE CREDENCIALES */}
      {screen === "forceChange" && (
        <ForceChangeCredentials
          userData={currentUser}
          onSuccess={handlePasswordChangeComplete}
          onBack={handleBackToLogin}
        />
      )}

      {/* DASHBOARD */}
      {screen === "dashboard" && (
        <DashboardScreen userData={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;