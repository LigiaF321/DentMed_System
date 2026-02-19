import React from "react";
import "./CrearCuentaPlaceholder.css";

export default function CrearCuentaPlaceholder() {
  return (
    <div className="dm-cc-placeholder">
      <div className="dm-cc-icon">
        <i className="fa-solid fa-user-plus" />
      </div>
      <h2 className="dm-cc-title">Crear cuenta de dentista</h2>
      <p className="dm-cc-text">
        Formulario para registrar nuevos dentistas en el sistema.
      </p>
    </div>
  );
}
