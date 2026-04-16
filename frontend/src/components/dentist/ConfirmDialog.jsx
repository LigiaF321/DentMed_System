import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  open,
  title = 'Confirmar acción',
  message = '¿Estás seguro de continuar?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon ${variant} dentista-titulo-md`}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <h3 className="dentista-titulo">{title}</h3>
            <p className="dentista-texto-normal">{message}</p>
          </div>
        </div>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-btn secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-dialog-btn ${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;