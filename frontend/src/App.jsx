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
  const [screen, setScreen] = useState(() => localStorage.getItem("screen") || "login");
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  });

  // token temporal para reset
  const [resetToken, setResetToken] = useState(null);
  const [resetEmail, setResetEmail] = useState(null);

  const goTo = (next) => setScreen(next);

  // Guardar screen y currentUser en localStorage cuando cambien
  React.useEffect(() => {
    localStorage.setItem("screen", screen);
  }, [screen]);
  React.useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  const handleLoginSuccess = (userData) => {
    if (!userData) {
      setCurrentUser(null);
      goTo("login");
      return;
    }

    setCurrentUser(userData);
    goTo("loading");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    goTo("login");
    localStorage.removeItem("screen");
    localStorage.removeItem("currentUser");
  };

  // Forgot verifica el código
  const handleVerifiedCode = ({ token, email }) => {
    setResetToken(token);
    setResetEmail(email);
    goTo("resetPassword");
  };

  const handleBackToLogin = () => {
    setCurrentUser(null);
    goTo("login");
  };

  const handleResetDone = () => {
    setResetToken(null);
    setResetEmail(null);
    goTo("login");
  };

  const handleLoadingComplete = () => {
    const mustChange = currentUser.mustChangePassword === true ||
      currentUser.forcePasswordChange === true ||
      currentUser.firstLogin === true ||
      currentUser.requiresPasswordChange === true; 

    if (mustChange) goTo("forceChange");
    else goTo("dashboard");
  };

  return (
    <div className="App">
      {screen === "loading" && <WelcomeScreen onEnter={handleLoadingComplete} />}

      {screen === "login" && (
        <LoginScreen
          onBack={() => goTo("login")}
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

