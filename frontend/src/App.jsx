import React, { useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome"); // welcome | login | dashboard

  return (
    <div className="App">
      {screen === "welcome" && (
        <WelcomeScreen onEnter={() => setScreen("login")} />
      )}

      {screen === "login" && (
        <LoginScreen
          onBack={() => setScreen("welcome")}
          onLoginSuccess={() => setScreen("dashboard")}
        />
      )}

      {screen === "dashboard" && <DashboardScreen />}
    </div>
  );
}

export default App;