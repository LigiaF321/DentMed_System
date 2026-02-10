import React, { useEffect, useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ClinicHoursScreen from "./components/config/ClinicHoursScreen";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome"); // welcome | login | forgot | dashboard | hours

  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "").trim();
      if (hash) setScreen(hash);
    };

    readHash(); 
    window.addEventListener("hashchange", readHash);

    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  const go = (to) => {
    setScreen(to);
    window.location.hash = to;
  };

  return (
    <div className="App">
      {screen === "welcome" && <WelcomeScreen onEnter={() => go("login")} />}

      {screen === "login" && (
        <LoginScreen
          onBack={() => go("welcome")}
          onLoginSuccess={() => go("dashboard")}
          onForgotPassword={() => go("forgot")}
        />
      )}

      {screen === "forgot" && <ForgotPasswordScreen onBack={() => go("login")} />}

      {screen === "dashboard" && <DashboardScreen />}

      {screen === "hours" && <ClinicHoursScreen onBack={() => go("dashboard")} />}

      {/* fallback si alguien pone un hash raro */}
      {["welcome", "login", "forgot", "dashboard", "hours"].includes(screen) === false && (
        <WelcomeScreen onEnter={() => go("login")} />
      )}
    </div>
  );
}

export default App;