import React, { useState, useRef, useEffect } from "react";
import logoDentMed from "../../assets/dentmed-logo.png";
import "./AdminSidebar.css";

const MENU_ITEMS = [
  { id: "dashboard",          label: "Panel de control",         icon: "fa-chart-line" },
  { id: "consultorios",       label: "Consultorios",             icon: "fa-door-open",      adminOnly: true },
  { id: "crear-cuenta",       label: "Crear cuenta",             icon: "fa-user-plus" },
  { id: "gestionar-cuentas",  label: "Gestionar cuentas",        icon: "fa-users" },
  { id: "horarios",           label: "Horarios de Atención",     icon: "fa-clock" },
  { id: "parametros",         label: "Parámetros del Sistema",   icon: "fa-sliders" },
  { id: "monitoreo",          label: "Monitoreo del Sistema",    icon: "fa-chart-area" },
  { id: "auditoria",          label: "Auditoría y Actividad",    icon: "fa-clipboard-list", adminOnly: true },
  { id: "restauracion",       label: "Restauración del Sistema", icon: "fa-database" },
  { id: "catalogo-insumos",   label: "Catálogo de Insumos",      icon: "fa-boxes-stacked" },
  { id: "kardex-movimientos", label: "Kardex / Movimientos",     icon: "fa-right-left" },
  { id: "reportes-consumo",   label: "Reportes de Consumo",      icon: "fa-chart-column",   adminOnly: true },
];

const BRAND_GRADIENT = 'linear-gradient(135deg, #4f46e5, #db2777)';
const BRAND_PRIMARY  = '#4f46e5';
const BRAND_LIGHT    = '#f0effe';

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #d1d5db', borderRadius: 10,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 2000, backdropFilter: 'blur(4px)', padding: 16,
};

const modalBox = (maxW) => ({
  background: 'white', borderRadius: 20, width: '100%', maxWidth: maxW,
  boxShadow: '0 24px 48px rgba(0,0,0,0.2)', overflow: 'hidden',
});

const modalHeader = {
  background: BRAND_GRADIENT, padding: '20px 24px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};

const closeBtn = {
  background: 'rgba(255,255,255,0.2)', border: 'none',
  borderRadius: 8, color: 'white', width: 32, height: 32,
  cursor: 'pointer', fontSize: 16,
};

const btnPrimary   = { padding: '10px 20px', borderRadius: 10, border: 'none', background: BRAND_GRADIENT, color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 14 };
const btnSecondary = { padding: '10px 20px', borderRadius: 10, border: 'none', background: '#f1f5f9', color: '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 14 };

const EditarPerfilModal = ({ open, onClose, userData, onGuardado }) => {
  const [form,   setForm]   = useState({ nombre: '', correo: '', telefono: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [ok,     setOk]     = useState(false);

  useEffect(() => {
    if (open && userData) {
      setForm({
        nombre:   userData.username || userData.nombre || '',
        correo:   userData.email    || '',
        telefono: userData.telefono || '',
      });
      setError(''); setOk(false);
    }
  }, [open, userData]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';
      const res   = await fetch('http://localhost:3000/api/admin/perfil', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error al guardar');
      setOk(true);
      if (onGuardado) onGuardado({ username: form.nombre, email: form.correo, telefono: form.telefono });
      setTimeout(() => { setOk(false); onClose(); }, 1500);
    } catch (err) { setError(err.message || 'Error'); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div style={modalOverlay}>
      <div style={modalBox(480)}>
        <div style={modalHeader}>
          <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-user-edit"></i> Editar perfil
          </h3>
          <button onClick={onClose} style={closeBtn}>x</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Nombre',   name: 'nombre',   type: 'text'  },
            { label: 'Correo',   name: 'correo',   type: 'email' },
            { label: 'Telefono', name: 'telefono', type: 'tel'   },
          ].map(f => (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{f.label}</label>
              <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} style={inputStyle} />
            </div>
          ))}
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{error}</div>}
          {ok    && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>Perfil actualizado</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CambiarPasswordModal = ({ open, onClose }) => {
  const [form,        setForm]        = useState({ actual: '', nueva: '', confirmar: '' });
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [ok,          setOk]          = useState(false);
  const [showActual,  setShowActual]  = useState(false);
  const [showNueva,   setShowNueva]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) { setForm({ actual: '', nueva: '', confirmar: '' }); setError(''); setOk(false); }
  }, [open]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.nueva !== form.confirmar) { setError('Las contrasenas no coinciden.'); return; }
    if (form.nueva.length < 6)         { setError('Minimo 6 caracteres.'); return; }
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';
      const res   = await fetch('http://localhost:3000/api/admin/cambiar-password', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordActual: form.actual, passwordNueva: form.nueva }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      setOk(true);
      setTimeout(() => { setOk(false); onClose(); }, 1500);
    } catch (err) { setError(err.message || 'Error'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const passField = (label, name, show, setShow) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} name={name} value={form[name]} onChange={handleChange}
          style={{ ...inputStyle, paddingRight: 40 }} />
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>
          <i className={`fas fa-eye${show ? '-slash' : ''}`}></i>
        </button>
      </div>
    </div>
  );

  return (
    <div style={modalOverlay}>
      <div style={modalBox(420)}>
        <div style={modalHeader}>
          <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-lock"></i> Cambiar contrasena
          </h3>
          <button onClick={onClose} style={closeBtn}>x</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {passField('Contrasena actual',    'actual',    showActual,  setShowActual)}
          {passField('Nueva contrasena',     'nueva',     showNueva,   setShowNueva)}
          {passField('Confirmar contrasena', 'confirmar', showConfirm, setShowConfirm)}
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{error}</div>}
          {ok    && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>Contrasena actualizada</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Cambiar contrasena'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FotoPerfilModal = ({ open, onClose, fotoActual, onFotoGuardada }) => {
  const [vista,   setVista]   = useState('menu');
  const [preview, setPreview] = useState(null);
  const [file,    setFile]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [ok,      setOk]      = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setVista(fotoActual ? 'menu' : 'subir');
      setPreview(null); setFile(null); setError(''); setOk(false);
    }
  }, [open, fotoActual]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Maximo 5 MB.'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleSubir = async (e) => {
    e.preventDefault();
    if (!file) { setError('Selecciona una imagen.'); return; }
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';
      const fd    = new FormData();
      fd.append('foto', file);
      const res  = await fetch('http://localhost:3000/api/admin/foto', {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error al subir foto');
      setOk(true);
      const fotoUrl = `http://localhost:3000${data?.url}` || preview;
      if (onFotoGuardada) onFotoGuardada(fotoUrl);
      setTimeout(() => { setOk(false); onClose(); }, 1500);
    } catch (err) { setError(err.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleEliminar = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:3000/api/admin/foto', {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error al eliminar');
      if (onFotoGuardada) onFotoGuardada(null);
      onClose();
    } catch (err) { setError(err.message || 'Error'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  if (vista === 'menu' && fotoActual) {
    return (
      <div style={modalOverlay}>
        <div style={modalBox(400)}>
          <div style={modalHeader}>
            <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-camera"></i> Foto de perfil
            </h3>
            <button onClick={onClose} style={closeBtn}>x</button>
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <img src={fotoActual} alt="Foto actual"
              style={{ width: 200, height: 200, borderRadius: 16, objectFit: 'cover', border: `3px solid ${BRAND_PRIMARY}`, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} />
            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box' }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <button type="button" onClick={() => { setVista('subir'); setPreview(null); setFile(null); }}
                style={{ ...btnPrimary, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className="fas fa-upload"></i> Cambiar foto
              </button>
              <button type="button" onClick={handleEliminar} disabled={saving}
                style={{ ...btnSecondary, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#dc2626', background: '#fef2f2' }}>
                <i className="fas fa-trash-alt"></i> {saving ? 'Eliminando...' : 'Eliminar foto'}
              </button>
              <button type="button" onClick={onClose} style={{ ...btnSecondary, width: '100%' }}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlay}>
      <div style={modalBox(400)}>
        <div style={modalHeader}>
          <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-camera"></i> {fotoActual ? 'Cambiar foto' : 'Foto de perfil'}
          </h3>
          <button onClick={onClose} style={closeBtn}>x</button>
        </div>
        <form onSubmit={handleSubir} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div onClick={() => inputRef.current?.click()}
            style={{ width: 120, height: 120, borderRadius: '50%', background: preview ? 'transparent' : BRAND_LIGHT, border: `3px dashed ${BRAND_PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
            {preview
              ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center', color: BRAND_PRIMARY }}>
                  <i className="fas fa-camera" style={{ fontSize: 28, display: 'block', marginBottom: 6 }}></i>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Seleccionar</span>
                </div>
            }
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, textAlign: 'center' }}>JPG, PNG o WEBP - max. 5 MB</p>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box' }}>{error}</div>}
          {ok    && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box' }}>Foto actualizada</div>}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button type="button" onClick={() => fotoActual ? setVista('menu') : onClose()} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
            <button type="submit" disabled={saving || !file} style={{ ...btnPrimary, flex: 1, opacity: (saving || !file) ? 0.6 : 1 }}>
              {saving ? 'Subiendo...' : 'Guardar foto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminSidebar({ activeView, onSelect, onLogout, userData, alertCount = 0, onPerfilActualizado }) {
  const [showProfileMenu,  setShowProfileMenu]  = useState(false);
  const [showEditarPerfil, setShowEditarPerfil] = useState(false);
  const [showCambiarPass,  setShowCambiarPass]  = useState(false);
  const [showFoto,         setShowFoto]         = useState(false);
  const [nombreLocal,      setNombreLocal]      = useState('');
  const [fotoUrl,          setFotoUrl]          = useState(
    userData?.foto_url ? `http://localhost:3000${userData.foto_url}` : null
  );

  const profileRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (userData) {
      setNombreLocal(userData.username || userData.nombre || userData.email?.split('@')?.[0] || 'Admin');
      if (userData.foto_url) {
        setFotoUrl(`http://localhost:3000${userData.foto_url}`);
      }
    }
  }, [userData]);

  const currentRole = userData?.role || userData?.rol;
  const name        = nombreLocal || userData?.username || userData?.email?.split('@')?.[0] || 'Admin';
  const userInitial = String(name || 'A').charAt(0).toUpperCase();
  const roleLabel   = currentRole === 'admin' ? 'Administrador' : 'Doctor(a)';

  const handlePerfilGuardado = (datos) => {
    if (datos?.username) setNombreLocal(datos.username);
    if (onPerfilActualizado) onPerfilActualizado(datos);
  };

  const opciones = [
    { icon: 'fa-user-edit', label: 'Editar perfil',      action: () => { setShowProfileMenu(false); setShowEditarPerfil(true); } },
    { icon: 'fa-lock',      label: 'Cambiar contrasena', action: () => { setShowProfileMenu(false); setShowCambiarPass(true);  } },
    { icon: 'fa-camera',    label: 'Foto de perfil',     action: () => { setShowProfileMenu(false); setShowFoto(true);         } },
  ];

  return (
    <>
      <aside className="dm2-side">
        <div className="dm2-side-top">
          <div className="dm2-logoBox" title="DentMed">
            <img src={logoDentMed} alt="DentMed" className="dm2-logoImg" />
          </div>
          <div className="dm2-side-sectionTitle">Menú</div>
          <nav className="dm2-side-nav">
            {MENU_ITEMS.map((item) => {
              if (item.adminOnly && currentRole !== 'admin') return null;
              const isActive     = activeView === item.id;
              const displayLabel = item.id === 'alertas-seguridad' && alertCount > 0
                ? `${item.label} (${alertCount})`
                : item.label;
              return (
                <button key={item.id} type="button"
                  className={`dm2-side-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}>
                  <span className="dm2-side-ico" aria-hidden="true">
                    <i className={`fa-solid ${item.icon}`} />
                  </span>
                  <span className="dm2-side-label">{displayLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="dm2-side-bottom">
          <div ref={profileRef} style={{ position: 'relative' }}>
            {showProfileMenu && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
                background: 'white', borderRadius: 14,
                boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
                border: '1px solid #e9ecef', overflow: 'hidden', zIndex: 100,
              }}>
                <div style={{ padding: '14px 16px', background: `linear-gradient(135deg, ${BRAND_LIGHT}, #fdf2f8)`, borderBottom: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{roleLabel}</div>
                </div>
                {opciones.map((op, i) => (
                  <button key={i} type="button" onClick={op.action}
                    style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#374151', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <i className={`fas ${op.icon}`} style={{ fontSize: 13, width: 16, color: BRAND_PRIMARY }}></i>
                    {op.label}
                  </button>
                ))}
              </div>
            )}

            <button type="button" onClick={() => setShowProfileMenu(s => !s)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, borderRadius: 12 }}>
              {/* ── CAMBIO: sin style inline, usa solo el CSS ── */}
              <div className="dm2-side-user">
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${showProfileMenu ? BRAND_PRIMARY : 'rgba(255,255,255,0.2)'}`, transition: 'border 0.15s' }}>
                  {fotoUrl
                    ? <img src={fotoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div className="dm2-side-avatar" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{userInitial}</div>
                  }
                </div>
                <div className="dm2-side-usertext" style={{ flex: 1, minWidth: 0 }}>
                  <div className="dm2-side-username" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                  <div className="dm2-side-role">{roleLabel}</div>
                </div>
                <i className={`fas fa-chevron-${showProfileMenu ? 'down' : 'up'}`} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}></i>
              </div>
            </button>
          </div>

          <button className="dm2-side-logout" type="button" onClick={onLogout}>
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <EditarPerfilModal
        open={showEditarPerfil}
        onClose={() => setShowEditarPerfil(false)}
        userData={userData}
        onGuardado={handlePerfilGuardado}
      />
      <CambiarPasswordModal open={showCambiarPass} onClose={() => setShowCambiarPass(false)} />
      <FotoPerfilModal
        open={showFoto}
        onClose={() => setShowFoto(false)}
        fotoActual={fotoUrl}
        onFotoGuardada={(url) => setFotoUrl(url)}
      />
    </>
  );
}