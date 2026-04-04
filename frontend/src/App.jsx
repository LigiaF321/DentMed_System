import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import ForceChangeCredentials from "./components/ForceChangeCredentials";
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

  // Tokens reset (no persist)
  const [resetToken, setResetToken] = useState(null);
  const [resetEmail, setResetEmail] = useState(null);

  // Sincronizar estado con localStorage
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

  const handleLoginSuccess = (userData) => {
    if (!userData) {
      limpiarSesion();
      return;
    }

    setCurrentUser(userData);
    setScreen("loading"); // Sync inmediato
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
    const mustChange = currentUser?.mustChangePassword === true ||
      currentUser?.forcePasswordChange === true ||
      currentUser?.firstLogin === true ||
      currentUser?.requiresPasswordChange === true;

    goTo(mustChange ? "forceChange" : "dashboard");
  };

  const handleBackToLogin = () => {
    limpiarSesion();
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

      {screen === "forceChange" && (
        <ForceChangeCredentials
          userData={currentUser}
          onSuccess={() => goTo("dashboard")}
          onBack={handleBackToLogin}
        />
      )}

      {screen === "dashboard" && (
        <DashboardScreen userData={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;