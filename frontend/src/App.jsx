// Test commit frontend admin
import React, { useState } from "react";

import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ForceChangeCredentials from "./components/ForceChangeCredentials";

import AdminLayout from "./components/admin/AdminLayout";
import DentistDashboard from "./components/dentist/DentistDashboard";

import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome");
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);

    if (userData?.requiresPasswordChange) {
      setScreen("forceChange");
    } else {
      setScreen("dashboard");
    }
  };

  const handlePasswordChangeComplete = () => {
    setScreen("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setScreen("welcome");
  };

  // ✅ Robustez: aceptar varios strings que podrían venir como rol de admin
  const roleNormalized = (currentUser?.role || "").toString().trim().toLowerCase();
  const isAdmin =
    roleNormalized === "admin" ||
    roleNormalized === "administrador" ||
    roleNormalized === "administradora" ||
    roleNormalized === "administrator";

  return (
    <div className="App">
      {screen === "welcome" && (
        <WelcomeScreen onEnter={() => setScreen("login")} />
      )}

      {screen === "login" && (
        <LoginScreen
          onBack={() => setScreen("welcome")}
          onLoginSuccess={handleLoginSuccess}
          onForgotPassword={() => setScreen("forgot")}
        />
      )}

      {screen === "forceChange" && currentUser && (
        <ForceChangeCredentials
          userData={currentUser}
          onSuccess={handlePasswordChangeComplete}
          onBack={() => {
            setCurrentUser(null);
            setScreen("login");
          }}
        />
      )}

      {screen === "forgot" && (
        <ForgotPasswordScreen onBack={() => setScreen("login")} />
      )}

      {screen === "dashboard" && currentUser && (
        isAdmin ? (
          <AdminLayout userData={currentUser} onLogout={handleLogout} />
        ) : (
          <DentistDashboard userData={currentUser} onLogout={handleLogout} />
        )
      )}
    </div>
  );
}

export default App;
