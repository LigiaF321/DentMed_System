import React, { useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import Swal from 'sweetalert2';
import { getAuthToken } from '../../utils/auth';
import { resolveMediaUrl } from '../../utils/media';
import './AdminProfileScreen.css';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedAvatarFile = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    size,
    size,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo crear la imagen recortada'));
          return;
        }
        resolve(new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92
    );
  });
};

export default function AdminProfileScreen({ userData, onUserDataUpdate, onBack }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fotoPreview: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isSavingNoticeClosing, setIsSavingNoticeClosing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [cropSource, setCropSource] = useState('');
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const savedTimeoutRef = React.useRef(null);
  const closeTimeoutRef = React.useRef(null);
  const previewObjectUrlRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        window.clearTimeout(savedTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
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
      fotoPreview: resolveMediaUrl(userData?.avatar),
    });
  }, [userData]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleEmailBlur = async () => {
    const emailIngresado = String(form.email || '').trim().toLowerCase();
    const emailActualUsuario = String(userData?.email || '').trim().toLowerCase();

    if (!emailIngresado || emailIngresado === emailActualUsuario) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/dentistas/validar-email?email=${encodeURIComponent(emailIngresado)}`);
      if (!response.ok) return;
      const data = await response.json();

      if (data?.disponible === false && data?.rol === 'dentista') {
        await Swal.fire({
          icon: 'warning',
          title: 'Correo ya registrado',
          text: 'Este correo ya está registrado como doctor. Por favor use otro correo.',
          confirmButtonText: 'Entendido',
        });
        setForm((prev) => ({ ...prev, email: emailActualUsuario || '' }));
      }
    } catch (error) {
      console.error('No se pudo validar el correo:', error);
    }
  };

  const handlePasswordFieldChange = (field) => (event) => {
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropSource(objectUrl);
    setIsCropOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPixels(null);
    event.target.value = '';
  };

  const handleCropApply = async () => {
    if (!cropSource || !croppedPixels) return;
    try {
      const croppedFile = await getCroppedAvatarFile(cropSource, croppedPixels);
      const previewUrl = URL.createObjectURL(croppedFile);

      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      previewObjectUrlRef.current = previewUrl;

      setPhotoFile(croppedFile);
      setForm((prev) => ({ ...prev, fotoPreview: previewUrl }));
      setIsCropOpen(false);
      URL.revokeObjectURL(cropSource);
      setCropSource('');
    } catch (error) {
      console.error('Error recortando imagen:', error);
    }
  };

  const handleCropCancel = () => {
    setIsCropOpen(false);
    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }
    setCropSource('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPixels(null);
  };

  const openPasswordModal = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordVisibility({ currentPassword: false, newPassword: false, confirmPassword: false });
    setPasswordError('');
    setPasswordSuccess('');
    setIsPasswordSaving(false);
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (isPasswordSaving) return;
    setIsPasswordModalOpen(false);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Todos los campos son obligatorios.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setIsPasswordSaving(true);
      const token = getAuthToken();

      const response = await fetch('/api/dentistas/perfil/cambiar-contrasena', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo cambiar la contraseña.');
      }

      setPasswordSuccess('Contraseña actualizada correctamente.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      window.setTimeout(() => {
        setIsPasswordModalOpen(false);
      }, 900);
    } catch (error) {
      setPasswordError(error.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setIsPasswordSaving(false);
    }
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
        fotoPreview: resolveMediaUrl(updated.avatar) || prev.fotoPreview,
      }));

      if (typeof onUserDataUpdate === 'function') {
        onUserDataUpdate({
          nombre: updated.nombre || form.nombre,
          apellidos: updated.apellidos || form.apellido,
          email: updated.email || form.email,
          telefono: updated.telefono || form.telefono,
          avatar: resolveMediaUrl(updated.avatar) || form.fotoPreview,
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
      {isPasswordModalOpen ? (
        <div className="dm2-password-modal-backdrop">
          <div className="dm2-password-modal">
            <div className="dm2-password-modal-head">
              <h3><i className="fa-solid fa-lock" /> Cambiar contraseña</h3>
              <button type="button" className="dm2-password-close" onClick={closePasswordModal} aria-label="Cerrar">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form className="dm2-password-modal-body" onSubmit={handlePasswordSubmit}>
              <div className="dm2-password-input-group">
                <label>Contraseña actual</label>
                <div className="dm2-password-input-wrap">
                  <input
                    type={passwordVisibility.currentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFieldChange('currentPassword')}
                    autoComplete="current-password"
                  />
                  <button type="button" className="dm2-password-toggle" onClick={() => togglePasswordVisibility('currentPassword')}>
                    <i className={`fa-solid ${passwordVisibility.currentPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="dm2-password-input-group">
                <label>Nueva contraseña</label>
                <div className="dm2-password-input-wrap">
                  <input
                    type={passwordVisibility.newPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFieldChange('newPassword')}
                    autoComplete="new-password"
                  />
                  <button type="button" className="dm2-password-toggle" onClick={() => togglePasswordVisibility('newPassword')}>
                    <i className={`fa-solid ${passwordVisibility.newPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="dm2-password-input-group">
                <label>Confirmar contraseña nueva</label>
                <div className="dm2-password-input-wrap">
                  <input
                    type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFieldChange('confirmPassword')}
                    autoComplete="new-password"
                  />
                  <button type="button" className="dm2-password-toggle" onClick={() => togglePasswordVisibility('confirmPassword')}>
                    <i className={`fa-solid ${passwordVisibility.confirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              {passwordError ? <div className="dm2-password-error">{passwordError}</div> : null}
              {passwordSuccess ? <div className="dm2-password-success">{passwordSuccess}</div> : null}

              <div className="dm2-password-modal-actions">
                <button type="button" className="dm2-password-cancel" onClick={closePasswordModal}>
                  Cancelar
                </button>
                <button type="submit" className="dm2-password-submit" disabled={isPasswordSaving}>
                  {isPasswordSaving ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isCropOpen ? (
        <div className="dm2-crop-modal-backdrop">
          <div className="dm2-crop-modal">
            <div className="dm2-crop-header">
              <h3>Editar imagen</h3>
              <button type="button" className="dm2-crop-close" onClick={handleCropCancel} aria-label="Cerrar">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="dm2-crop-area">
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedPixels(croppedAreaPixels)}
              />
            </div>

            <div className="dm2-crop-slider">
              <i className="fa-regular fa-image" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <i className="fa-solid fa-image" />
            </div>

            <div className="dm2-crop-actions">
              <button type="button" className="dm2-crop-cancel" onClick={handleCropCancel}>
                Cancelar
              </button>
              <button type="button" className="dm2-crop-apply" onClick={handleCropApply}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dm2-card dm2-profile-card">
        <div className="dm2-card-head">
          <div className="dm2-card-title">Mi configuración</div>
          {onBack ? (
            <button type="button" className="dm2-profile-backBtn" onClick={onBack}>
              Volver
            </button>
          ) : null}
        </div>
        <div className="dm2-profile-grid">
          <div className="dm2-profile-summary">
            <label htmlFor="admin-photo-upload" className="dm2-profile-photoWrap dm2-profile-photoWrap--clickable" title="Cambiar foto de perfil">
              {form.fotoPreview ? (
                <img src={form.fotoPreview} alt="Foto de perfil" className="dm2-profile-photo" />
              ) : (
                <div className="dm2-profile-avatar">
                  {String(profileLabel).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="dm2-profile-photoOverlay" aria-hidden="true">
                <i className="fa-solid fa-pen" />
              </div>
            </label>
            <div className="dm2-photo-upload">
              <div className="dm2-photo-upload-label">Foto de perfil</div>
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
                onBlur={handleEmailBlur}
                placeholder="admin@dentmed.com"
              />
            </div>
            <div className="dm2-profile-field">
              <label>Contraseña</label>
              <div className="dm2-password-row">
                <div className="dm2-password-fieldWrap dm2-password-fieldWrap--readonly">
                  <input
                    type="password"
                    value="************"
                    readOnly
                    aria-label="Contraseña actual oculta"
                  />
                </div>
                <button type="button" className="dm2-profile-backBtn" onClick={openPasswordModal}>
                  Cambiar contraseña
                </button>
              </div>
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
              {saved ? (
                <div className={`dm2-save-notice ${isSavingNoticeClosing ? 'dm2-save-notice--out' : ''}`}>
                  <span className="dm2-save-icon">✓</span>
                  <span>Guardado correctamente</span>
                </div>
              ) : null}
              <button type="submit" className="dm2-btn-primary">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}