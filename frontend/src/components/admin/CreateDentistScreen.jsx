import { useState } from "react";
import DentistForm from "./DentistForm";
import "./admin.css";

export default function CreateDentistScreen() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="adm-page">
      <div className="adm-hero">
        <div className="adm-hero-ico">
          <i className="fa-solid fa-user-plus" />
        </div>

        <h1 className="adm-hero-title">Crear cuenta de dentista</h1>
        <p className="adm-hero-sub">
          Formulario para registrar nuevos dentistas en el sistema.
        </p>

        {/*  BOTÓN PARA ENTRAR AL FORMULARIO */}
        {!showForm && (
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="adm-btn primary"
              onClick={() => setShowForm(true)}
            >
              <i className="fa-solid fa-pen-to-square" /> Crear dentista
            </button>
          </div>
        )}
      </div>

      {/*  FORMULARIO SOLO SI showForm === true */}
      {showForm && (
        <div className="adm-form-wrap">
          <DentistForm
            onCancel={() => setShowForm(false)}
            onCreated={() => {
              
            }}
          />
        </div>
      )}
    </div>
  );
}
