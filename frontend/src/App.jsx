import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import './App.css';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  const handleEnterSystem = () => {
    setShowWelcome(false);
  };

  const handleBackToWelcome = () => {
    setShowWelcome(true);
  };

  return (
    <div className="App">
      {showWelcome ? (
        <WelcomeScreen onEnter={handleEnterSystem} />
      ) : (
        <LoginScreen onBack={handleBackToWelcome} />
      )}
    </div>
  );
}

export default App;