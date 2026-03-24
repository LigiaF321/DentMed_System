import React, { useEffect, useState } from 'react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onEnter }) => {
  const [loadingPhase, setLoadingPhase] = useState(0); // 0: initial, 1: loading...

  useEffect(() => {
    // Create particles
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

    // 2 second auto-redirect
    const timer = setTimeout(() => {
      if (onEnter) onEnter();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onEnter]);

  return (
    <div className="welcome-screen">
      <div className="particles" id="particles"></div>

      <div className="welcome-container">
        <h1 className="logo-title">
          <span className="dent-text">Dent</span>
          <span className="med-text">Med</span>
        </h1>
        <p className="tagline">Sistema de Gestión Dental</p>
        <p className="slogan">WORK SPACE BY MILLA'S</p>

        <div className="loading-area">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando sistema...</p>
        </div>

        <p className="footer-note">
          © 2026 DentMed - Acceso exclusivo para personal autorizado
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;

