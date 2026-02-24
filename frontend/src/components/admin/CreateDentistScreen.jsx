import { useState } from "react";
import DentistForm from "./DentistForm";
import "./admin.css";

export default function CreateDentistScreen() {
  const [showForm, setShowForm] = useState(false);

  // Guardamos resultado para mostrar confirmación
  const [createdInfo, setCreatedInfo] = useState(null);

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

        {/* BOTÓN PARA ENTRAR AL FORMULARIO */}
        {!showForm && (
          <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className="adm-btn primary"
              onClick={() => {
                setCreatedInfo(null);
                setShowForm(true);
              }}
            >
              <i className="fa-solid fa-pen-to-square" /> Crear dentista
            </button>
          </div>
        )}
      </div>

      {/* FORMULARIO SOLO SI showForm === true */}
      {showForm && (
        <div className="adm-form-wrap">
          <DentistForm
            onCancel={() => {
              setShowForm(false);
              setCreatedInfo(null);
            }}
            onCreated={(data) => {
              // data trae: { ...respuestaBackend, credentials: { tempPassword, email } }
              setCreatedInfo(data);
              setShowForm(false);
            }}
          />
        </div>
      )}

      {/*  CONFIRMACIÓN SIMPLE (sin depender de SuccessModal) */}
      {createdInfo && (
        <div className="adm-modal-backdrop" role="dialog" aria-modal="true">
          <div className="adm-modal">
            <div className="adm-modal-head">
              <div className="adm-success-ico">
                <i className="fa-solid fa-circle-check" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  Cuenta creada con éxito
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  Guarda estas credenciales temporales
                </div>
              </div>
            </div>

            <div className="adm-modal-body">
              <div className="adm-cred-box">
                <div className="adm-cred-title">Credenciales</div>

                <div className="adm-cred-row">
                  <span>Email:</span>
                  <strong>{createdInfo?.credentials?.email || "—"}</strong>
                </div>

                <div className="adm-cred-row">
                  <span>Contraseña temporal:</span>
                  <strong>{createdInfo?.credentials?.tempPassword || "—"}</strong>
                </div>
              </div>

              <div className="adm-warning">
                <i className="fa-solid fa-triangle-exclamation" />
                <div>
                  El dentista debe cambiar esta contraseña en su primer inicio de sesión.
                </div>
              </div>
            </div>

            <div className="adm-modal-actions">
              <button
                type="button"
                className="adm-btn secondary"
                onClick={() => setCreatedInfo(null)}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="adm-btn primary"
                onClick={() => {
                  setCreatedInfo(null);
                  setShowForm(true);
                }}
              >
                Crear otra cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}