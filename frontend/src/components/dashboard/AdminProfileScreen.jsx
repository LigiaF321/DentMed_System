import React, { useEffect, useState } from 'react';
import { getAuthToken } from '../../utils/auth';
import './AdminProfileScreen.css';

export default function AdminProfileScreen({ userData, onUserDataUpdate, onBack }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contrasena: '',
    fotoPreview: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isSavingNoticeClosing, setIsSavingNoticeClosing] = useState(false);
  const savedTimeoutRef = React.useRef(null);
  const closeTimeoutRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        window.clearTimeout(savedTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nombre = userData?.nombre || userData?.username || '';
    const apellido = userData?.apellidos || userData?.apellido || '';

    setForm({
      nombre,
      apellido,
      email: userData?.email || '',
      telefono: userData?.telefono || userData?.phone || '',
      contrasena: '',
      fotoPreview: userData?.avatar || '',
    });
  }, [userData]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setForm((prev) => ({ ...prev, fotoPreview: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (savedTimeoutRef.current) {
      window.clearTimeout(savedTimeoutRef.current);
    }
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    try {
      const token = getAuthToken();
      const formData = new FormData();

      formData.append('nombre', form.nombre || '');
      formData.append('apellidos', form.apellido || '');
      formData.append('email', form.email || '');
      formData.append('telefono', form.telefono || '');
      if (form.contrasena) {
        formData.append('contrasena', form.contrasena);
      }
      if (photoFile) {
        formData.append('avatar', photoFile);
      }

      const response = await fetch('/api/dentistas/perfil', {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'No se pudo guardar el perfil');
      }

      const data = await response.json();
      const updated = data.perfil || {};

      setForm((prev) => ({
        ...prev,
        fotoPreview: updated.avatar || prev.fotoPreview,
        contrasena: '',
      }));

      if (typeof onUserDataUpdate === 'function') {
        onUserDataUpdate({
          nombre: updated.nombre || form.nombre,
          apellidos: updated.apellidos || form.apellido,
          email: updated.email || form.email,
          telefono: updated.telefono || form.telefono,
          avatar: updated.avatar || form.fotoPreview,
        });
      }

      setSaved(true);
      setIsSavingNoticeClosing(false);
      savedTimeoutRef.current = window.setTimeout(() => {
        setIsSavingNoticeClosing(true);
      }, 3000);
      closeTimeoutRef.current = window.setTimeout(() => {
        setSaved(false);
        setIsSavingNoticeClosing(false);
      }, 3300);
    } catch (error) {
      console.error('Error guardando perfil:', error);
    }
  };

  const profileLabel = `${form.nombre || ''} ${form.apellido || ''}`.trim() || 'Administrador';

  return (
    <div className="dm2-page">
      <div className="dm2-card dm2-profile-card">
        <div className="dm2-card-head">
          <div className="dm2-card-title">Mi configuración</div>
          {onBack ? (
            <button type="button" className="dm2-profile-backBtn" onClick={onBack}>
              ← Volver
            </button>
          ) : null}
        </div>
        <div className="dm2-profile-grid">
          <div className="dm2-profile-summary">
            <div className="dm2-profile-photoWrap">
              {form.fotoPreview ? (
                <img src={form.fotoPreview} alt="Foto de perfil" className="dm2-profile-photo" />
              ) : (
                <div className="dm2-profile-avatar">
                  {String(profileLabel).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="dm2-photo-upload">
              <div className="dm2-photo-upload-label">Foto de perfil</div>
              <label htmlFor="admin-photo-upload" className="dm2-photo-upload-button">
                Elegir archivo
              </label>
              <input
                id="admin-photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="dm2-photo-upload-input"
              />
            </div>
            <div className="dm2-profile-info">
              <div className="dm2-profile-name">{profileLabel}</div>
              <div className="dm2-profile-role">Administrador</div>
              <div className="dm2-profile-meta">
                <span>{form.email || 'Correo no registrado'}</span>
                <span>{form.telefono || 'Teléfono no registrado'}</span>
              </div>
            </div>
          </div>

          <form className="dm2-profile-form" onSubmit={handleSubmit}>
            <div className="dm2-profile-field">
              <label>Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={handleChange('nombre')}
                placeholder="Nombre"
              />
            </div>
            <div className="dm2-profile-field">
              <label>Apellidos</label>
              <input
                type="text"
                value={form.apellido}
                onChange={handleChange('apellido')}
                placeholder="Apellidos"
              />
            </div>
            <div className="dm2-profile-field">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="admin@dentmed.com"
              />
            </div>
            <div className="dm2-profile-field">
              <label>Contraseña</label>
              <input
                type="password"
                value={form.contrasena}
                onChange={handleChange('contrasena')}
                placeholder="Nueva contraseña"
              />
            </div>
            <div className="dm2-profile-field dm2-profile-field-full">
              <label>Teléfono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={handleChange('telefono')}
                placeholder="+504 1234-5678"
              />
            </div>
            <div className="dm2-profile-actions">
              <button type="submit" className="dm2-btn-primary">
                Guardar cambios
              </button>
              {saved ? (
                <div className={`dm2-save-notice ${isSavingNoticeClosing ? 'dm2-save-notice--out' : ''}`}>
                  <span className="dm2-save-icon">✓</span>
                  <span>Guardado correctamente</span>
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
