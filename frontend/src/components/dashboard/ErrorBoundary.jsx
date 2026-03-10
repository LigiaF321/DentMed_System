import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Puedes enviar el error a un servicio externo aquí
    console.error("ErrorBoundary atrapó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dm2-page">
          <div className="dm2-card">
            <div className="dm2-card-head">
              <div className="dm2-card-title">Error en Auditoría</div>
            </div>
            <div className="dm2-card-body">
              <div className="dm2-empty">Ocurrió un error inesperado en la pantalla de auditoría.<br/>Por favor, recarga la página o contacta soporte.</div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
