import "./admin.css";

export default function SuccessModal({ data, onCreateAnother, onClose }) {
  const dentist = data?.dentist || {};
  const credentials = data?.credentials || {};

  return (
    <div className="adm-modal-backdrop" role="dialog" aria-modal="true">
      <div className="adm-modal">
        <div className="adm-modal-head">
          <div className="adm-success-ico">
            <i className="fa-solid fa-check" />
          </div>
          <div>
            <h3>¡Cuenta de dentista creada exitosamente!</h3>
            <p className="adm-muted">Resumen y credenciales generadas</p>
          </div>
        </div>

        <div className="adm-modal-body">
          <div className="adm-summary">
            <div><strong>Nombre:</strong> {dentist?.nombreCompleto || `${dentist?.nombres || ""} ${dentist?.apellidos || ""}`.trim()}</div>
            <div><strong>Email:</strong> {dentist?.email}</div>
            <div><strong>Especialidad:</strong> {dentist?.especialidad}</div>
          </div>

          <div className="adm-cred-box">
            <div className="adm-cred-title">Credenciales</div>
            <div className="adm-cred-row">
              <span>Usuario:</span>
              <strong>{credentials?.username || "—"}</strong>
            </div>
            <div className="adm-cred-row">
              <span>Contraseña temporal:</span>
              <strong>{credentials?.tempPassword || "—"}</strong>
            </div>
          </div>

          <div className="adm-warning">
            <i className="fa-solid fa-triangle-exclamation" />
            <div>
              <strong>Importante:</strong> Estas credenciales también se enviaron al email del dentista.
              Por seguridad, no guardes esta contraseña y recomienda cambiarla en el primer acceso.
            </div>
          </div>
        </div>

        <div className="adm-modal-actions">
          <button className="adm-btn secondary" type="button" onClick={onCreateAnother}>
            Crear otra cuenta
          </button>
          <button className="adm-btn primary" type="button" onClick={onClose}>
            Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
