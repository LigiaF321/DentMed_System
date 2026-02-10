import React, { useEffect } from 'react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onEnter }) => {
  useEffect(() => {
    // Crear partículas dinámicas
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;

      const particleCount = 30;
      particlesContainer.innerHTML = '';

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 20 + 5;
        const posX = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = Math.random() * 10 + 15;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;

        particlesContainer.appendChild(particle);
      }
    };

    createParticles();
  }, []);

  const handleEnter = () => {
    if (onEnter) {
      onEnter();
    }
  };

  return (
    <div className="welcome-screen">
      {/* Partículas de fondo */}
      <div className="particles" id="particles"></div>

      <div className="welcome-container">
        {/* Logo DentMed con colores específicos */}
        <h1 className="logo-title">
          <span className="dent-text">Dent</span>
          <span className="med-text">Med</span>
        </h1>
        <p className="tagline">Sistema de Gestión Dental</p>
        <p className="slogan">WORK SPACE BY MILLA'S</p>

        <button className="enter-button" onClick={handleEnter}>
          <i className="fas fa-tooth"></i> 
          INGRESAR AL SISTEMA
        </button>

        <p className="footer-note">
          © 2026 DentMed - Acceso exclusivo para personal autorizado
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;