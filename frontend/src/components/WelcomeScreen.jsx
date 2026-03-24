import React, { useEffect, useState } from 'react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onEnter }) => {
  const [loadingPhase, setLoadingPhase] = useState(0); // 0: initial, 1: loading...

  useEffect(() => {
    // 2 second auto-redirect
    const timer = setTimeout(() => {
      if (onEnter) onEnter();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onEnter]);

  return (
    <div className="welcome-screen">


      <div className="welcome-container">
        <h1 className="logo-title">
          <span className="dent-text">Dent</span>
          <span className="med-text">Med</span>
        </h1>


        <div className="loading-area">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando sistema...</p>
        </div>


      </div>
    </div>
  );
};

export default WelcomeScreen;

