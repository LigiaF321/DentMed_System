import React, { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen"; 
import ForceChangeCredentials from "./components/ForceChangeCredentials";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome");
  const [currentUser, setCurrentUser] = useState(null);

  // token temporal para reset
  const [resetToken, setResetToken] = useState(null);
  const [resetEmail, setResetEmail] = useState(null);

  const goTo = (next) => setScreen(next);

  const handleLoginSuccess = (userData) => {
    if (!userData) {
      setCurrentUser(null);
      goTo("login");
      return;
    }

    setCurrentUser(userData);

    const mustChange =
      userData.mustChangePassword === true ||
      userData.forcePasswordChange === true ||
      userData.firstLogin === true ||
      userData.requiresPasswordChange === true; 

    if (mustChange) goTo("forceChange");
    else goTo("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    goTo("welcome");
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

  return (
    <div className="App">
      {screen === "welcome" && <WelcomeScreen onEnter={() => goTo("login")} />}

      {screen === "login" && (
        <LoginScreen
          onBack={() => goTo("welcome")}
          onLoginSuccess={handleLoginSuccess}
          onForgotPassword={() => goTo("forgot")}
        />
      )}

      {/* Pantalla 1-2: Email + Código */}
      {screen === "forgot" && (
        <ForgotPasswordScreen
          onBack={() => goTo("login")}
          onVerified={handleVerifiedCode}
        />
      )}

      {/* Pantalla 3: Nueva contraseña */}
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