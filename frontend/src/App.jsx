import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/dashboard/DashboardScreen";
import CreateUserForm from "./components/CreateUserForm";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome"); // welcome | login | dashboard
  const [showCreateUser, setShowCreateUser] = useState(false);

  // Verificar sesión al cargar la app
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        setScreen("dashboard");
      }
    } catch (e) {}
  }, []);

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

      {screen === "dashboard" && (
        <>
          <DashboardScreen
            onConfig={() => {
              // No hay pantalla de configuración implementada en este App.jsx
              // puedes cambiar esto para navegar a una ruta o mostrar un modal
              console.log("Ir a configuración");
            }}
            onCreateUser={() => {
              setShowCreateUser(true);
            }}
            onLogout={() => {
              setScreen("welcome");
            }}
          />
          {showCreateUser && (
            <CreateUserForm
              onClose={() => setShowCreateUser(false)}
              onSubmit={(userData) => {
                console.log("Usuario creado:", userData);
                // Aquí puedes guardar el usuario en la base de datos
                setShowCreateUser(false);
                alert(`Usuario ${userData.username} creado exitosamente`);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;