import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import { resolveMediaUrl } from "./utils/media";
import "./App.css";

function App() {
  // Restore session on mount if exists, clear only on logout
  const [screen, setScreen] = useState(() => {
    try {
      const storedScreen = localStorage.getItem("screen");
      return storedScreen === "forceChange" ? "login" : (storedScreen || "login");
    } catch {
      return "login";
    }
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!parsed) return null;
      return {
        ...parsed,
        avatar: resolveMediaUrl(parsed.avatar),
      };
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
          Authorization: `Bearer ${token}`,
        },
      });

      const perfil = await res.json();

      const userCompleto = {
        ...userData,
        nombre: perfil.nombre,
        apellidos: perfil.apellidos,
        especialidad: perfil.especialidad,
        telefono: perfil.telefono,
        email: perfil.email || userData.email,
        avatar: resolveMediaUrl(perfil.avatar || userData.avatar),
      };

      setCurrentUser(userCompleto);
      setScreen("loading");
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setCurrentUser(userData);
      setScreen("loading");
    }
  };

  const updateCurrentUser = (updates) => {
    setCurrentUser((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("currentUser", JSON.stringify(next));
      } catch (e) {
        console.warn("No se pudo actualizar currentUser en localStorage", e);
      }
      return next;
    });
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

  const handleBackToLogin = () => {
    limpiarSesion();
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
        <DashboardScreen
          userData={currentUser}
          onLogout={handleLogout}
          onUserDataUpdate={updateCurrentUser}
        />
      )}

      {screen === "dashboard" && (
        <DashboardScreen userData={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;