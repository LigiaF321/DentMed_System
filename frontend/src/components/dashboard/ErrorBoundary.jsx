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
      const title = this.props.title || "Error en el módulo";
      const message =
        this.props.message ||
        "Ocurrió un error inesperado en esta pantalla. Recarga la página o revisa la consola del navegador.";

      return (
        <div className="dm2-page">
          <div className="dm2-card">
            <div className="dm2-card-head">
              <div className="dm2-card-title">{title}</div>
            </div>
            <div className="dm2-card-body">
              <div className="dm2-empty">{message}</div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
