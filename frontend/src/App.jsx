import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import "./App.css";

function App() {
  // Restore session on mount if exists, clear only on logout
  const [screen, setScreen] = useState(() => {
    try {
      return localStorage.getItem("screen") || "login";
    } catch {
      return "login";
    }
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  
  const [resetToken, setResetToken] = useState(null);
  const [resetEmail, setResetEmail] = useState(null);

  
  useEffect(() => {
    try {
      localStorage.setItem("screen", screen);
      if (currentUser) {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      }
    } catch (e) {
      console.warn("localStorage no disponible:", e);
    }
  }, [screen, currentUser]);

  const goTo = (next) => setScreen(next);

const handleLoginSuccess = async (userData) => {
  if (!userData) {
    limpiarSesion();
    return;
  }

  try {
    const token = userData.token;

    const res = await fetch("http://localhost:3000/api/dentistas/perfil", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const perfil = await res.json();

    const userCompleto = {
      ...userData,
      nombre: perfil.nombre,
      especialidad: perfil.especialidad
    };

    setCurrentUser(userCompleto);
    setScreen("loading");

  } catch (error) {
    console.error("Error cargando perfil:", error);

    // fallback
    setCurrentUser(userData);
    setScreen("loading");
  }
};

  const handleLogout = () => {
    limpiarSesion();
  };

  const limpiarSesion = () => {
    setCurrentUser(null);
    setResetToken(null);
    setResetEmail(null);
    setScreen("login");
    try {
      localStorage.removeItem("screen");
      localStorage.removeItem("currentUser");
    } catch {}
  };

  const handleVerifiedCode = ({ token, email }) => {
    setResetToken(token);
    setResetEmail(email);
    goTo("resetPassword");
  };

  const handleResetDone = () => {
    setResetToken(null);
    setResetEmail(null);
    goTo("login");
  };

  const handleLoadingComplete = () => {
    goTo("dashboard");
  };

  return (
    <div className="App">
      {screen === "loading" && <WelcomeScreen onEnter={handleLoadingComplete} />}

      {screen === "login" && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onForgotPassword={() => goTo("forgot")}
        />
      )}

      {screen === "forgot" && (
        <ForgotPasswordScreen
          onBack={() => goTo("login")}
          onVerified={handleVerifiedCode}
        />
      )}

      {screen === "resetPassword" && (
        <ResetPasswordScreen
          token={resetToken}
          email={resetEmail}
          onBack={() => goTo("login")}
          onSuccess={handleResetDone}
        />
      )}

      {screen === "dashboard" && (
        <DashboardScreen userData={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;