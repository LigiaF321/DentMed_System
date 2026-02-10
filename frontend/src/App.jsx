import React, { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome"); // welcome | login | forgot | dashboard
  
  return (
    <div className="App">
      {screen === "welcome" && (
        <WelcomeScreen onEnter={() => setScreen("login")} />
      )}
      {screen === "login" && (
        <LoginScreen 
          onLogin={() => setScreen("dashboard")}
          onForgotPassword={() => setScreen("forgot")}
        />
      )}
      {screen === "forgot" && (
        <ForgotPasswordScreen onBack={() => setScreen("login")} />
      )}
      {screen === "dashboard" && (
        <DashboardScreen onLogout={() => setScreen("welcome")} />
      )}
    </div>
  );
}

export default App;