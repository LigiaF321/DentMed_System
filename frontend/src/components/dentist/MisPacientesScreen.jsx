import React, { useEffect, useMemo, useState } from 'react';
import {
  buscarPacientes,
  obtenerPacienteDetalle,
  obtenerPacientesRecientes,
} from '../../services/pacientes.service';
import PatientTabs from './PatientTabs';
import Odontograma from './Odontograma';
import './MisPacientesScreen.css';

const STORAGE_KEY = 'dm20_recent_patient_searches';

const filtrosIniciales = {
  edad_min: '',
  edad_max: '',
  fecha_ultima_visita_desde: '',
  fecha_ultima_visita_hasta: '',
  activo: '',
};

const leerBusquedasRecientes = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const guardarBusquedaReciente = (entry) => {
  try {
    const current = leerBusquedasRecientes();
    const filtradas = current.filter(
      (item) => !(item.q === entry.q && JSON.stringify(item.filtros) === JSON.stringify(entry.filtros))
    );
    const updated = [entry, ...filtradas].slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) { console.error('Error guardando búsquedas recientes:', error); }
};

const formatearFecha = (valor) => {
  if (!valor) return '-';
  try { return new Date(valor).toLocaleDateString('es-HN'); } catch { return '-'; }
};

// ── Exportar expediente como PDF con colores de marca ────────────────────────
const exportarExpedientePDF = (paciente) => {
  const nombre     = paciente.paciente_nombre || paciente.nombre_completo || paciente.nombre || 'Paciente';
  const edad       = paciente.edad ?? '-';
  const sexo       = paciente.sexo || paciente.genero || 'No especificado';
  const tel        = paciente.telefono || 'No registrado';
  const email      = paciente.email || paciente.correo || paciente.correo_electronico || 'No registrado';
  const dir        = paciente.direccion || 'No registrada';
  const seguro     = paciente.seguro_medico || paciente.aseguradora || 'No registrado';
  const contactoE  = paciente.contacto_emergencia || paciente.nombre_contacto_emergencia || 'No registrado';
  const telE       = paciente.telefono_emergencia || paciente.contacto_emergencia_telefono || 'No registrado';
  const enfermedades = String(paciente.enfermedades || paciente.condiciones_cronicas || '') || '';
  const medicamentos = String(paciente.medicamentos || paciente.medicamentos_actuales || '') || '';
  const alergias     = String(paciente.alergias || '') || '';

  // Odontograma — representación textual de dientes marcados
  const odontograma = paciente.odontograma || {};
  const odontogramaHtml = Object.keys(odontograma).length > 0
    ? Object.entries(odontograma).map(([n, est]) => {
        const colores = { caries:'#E53935', planificado:'#FB8C00', obturado:'#43A047', tratamiento:'#1E88E5', extraido:'#757575' };
        const labels  = { caries:'Caries', planificado:'Planificado', obturado:'Obturado', tratamiento:'Tratamiento', extraido:'Extraído' };
        const color   = colores[est] || '#6b7280';
        return `<span style="display:inline-flex;align-items:center;gap:4px;background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;">${n} · ${labels[est]||est}</span>`;
      }).join('')
    : '<span style="font-size:12px;color:#9ca3af;">Sin registros en el odontograma</span>';

  const fecha = new Date().toLocaleDateString('es-HN', { day:'2-digit', month:'long', year:'numeric' });

  const chips = (val, tipo='normal') => {
    if (!val || val.trim() === '') return `<span style="color:#9ca3af;font-size:12px;">Sin registros</span>`;
    const bg    = tipo==='danger' ? '#fee2e2' : '#eff6ff';
    const color = tipo==='danger' ? '#dc2626' : '#2563eb';
    return val.split(',').map(v=>v.trim()).filter(Boolean)
      .map(v=>`<span style="display:inline-block;background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;margin:2px;">${v}</span>`)
      .join('');
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Expediente — ${nombre}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#1a2c3e; background:white; padding:32px; font-size:14px; }

    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:18px; margin-bottom:24px; position:relative; }
    .header::after { content:''; display:block; position:absolute; bottom:0; left:0; right:0; height:3px; background:linear-gradient(135deg,#4f46e5,#db2777); border-radius:2px; }
    .clinic-name { font-size:24px; font-weight:900; background:linear-gradient(135deg,#4f46e5,#db2777); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .clinic-sub  { font-size:12px; color:#6b7280; margin-top:2px; }
    .doc-title h1 { font-size:18px; font-weight:800; color:#111827; text-align:right; }
    .doc-title p  { font-size:11px; color:#6b7280; text-align:right; margin-top:3px; }

    .patient-card { background:linear-gradient(135deg,#f0effe,#fdf2f8); border-radius:14px; padding:18px 22px; margin-bottom:22px; border-left:5px solid #4f46e5; }
    .patient-name { font-size:22px; font-weight:900; color:#1e1b4b; }
    .patient-meta { font-size:12px; color:#6b7280; margin-top:5px; display:flex; gap:16px; flex-wrap:wrap; }
    .patient-meta span { display:flex; align-items:center; gap:4px; }

    .alert-box { background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:10px 16px; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
    .alert-label { font-size:12px; font-weight:800; color:#dc2626; white-space:nowrap; }

    .section { margin-bottom:22px; }
    .section-title { font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; padding-bottom:7px; margin-bottom:14px; display:flex; align-items:center; gap:8px; border-bottom:2px solid transparent; border-image:linear-gradient(135deg,#4f46e5,#db2777) 1; }
    .section-title-dot { width:8px; height:8px; border-radius:50%; background:linear-gradient(135deg,#4f46e5,#db2777); flex-shrink:0; }

    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .field { background:#f8fafc; border-radius:10px; padding:10px 14px; border:1px solid #e5e7eb; }
    .field-label { font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; }
    .field-value { font-size:14px; font-weight:600; color:#111827; }

    .odontograma-box { background:#f0effe; border-radius:10px; padding:14px 16px; border:1px solid #c4b5fd; margin-top:10px; }
    .odontograma-title { font-size:11px; font-weight:700; color:#4f46e5; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; }

    .sign-area { margin-top:36px; display:flex; justify-content:flex-end; }
    .sign-box { text-align:center; width:240px; }
    .sign-line { border-top:1px solid #374151; padding-top:8px; font-size:11px; color:#374151; }

    .footer { margin-top:24px; padding-top:14px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:10px; color:#9ca3af; }
    .footer-brand { font-weight:700; background:linear-gradient(135deg,#4f46e5,#db2777); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

    @media print { body{padding:20px;} @page{margin:1.5cm;} }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="clinic-name">DentMed</div>
      <div class="clinic-sub">Sistema de Gestión Clínica</div>
    </div>
    <div class="doc-title">
      <h1>Expediente del Paciente</h1>
      <p>Generado el ${fecha}</p>
    </div>
  </div>

  <!-- Paciente -->
  <div class="patient-card">
    <div class="patient-name">${nombre}</div>
    <div class="patient-meta">
      <span>Edad: <strong>${edad} años</strong></span>
      <span>Sexo: <strong>${sexo}</strong></span>
      ${paciente.id||paciente.id_paciente?`<span>ID: <strong>${paciente.id||paciente.id_paciente}</strong></span>`:''}
    </div>
  </div>

  <!-- Alerta de alergias -->
  ${alergias ? `<div class="alert-box"><span class="alert-label">⚠ ALERGIAS:</span><div style="font-size:13px;color:#7f1d1d;">${alergias}</div></div>` : ''}

  <!-- Información Personal -->
  <div class="section">
    <div class="section-title"><div class="section-title-dot"></div>Información Personal</div>
    <div class="grid-2">
      <div class="field"><div class="field-label">Correo electrónico</div><div class="field-value">${email}</div></div>
      <div class="field"><div class="field-label">Teléfono</div><div class="field-value">${tel}</div></div>
      <div class="field"><div class="field-label">Dirección</div><div class="field-value">${dir}</div></div>
      <div class="field"><div class="field-label">Seguro médico</div><div class="field-value">${seguro}</div></div>
      <div class="field"><div class="field-label">Contacto de emergencia</div><div class="field-value">${contactoE}</div></div>
      <div class="field"><div class="field-label">Teléfono emergencia</div><div class="field-value">${telE}</div></div>
    </div>
  </div>

  <!-- Historial Médico -->
  <div class="section">
    <div class="section-title"><div class="section-title-dot"></div>Historial Médico</div>
    <div class="grid-2">
      <div class="field">
        <div class="field-label">Enfermedades / Condiciones crónicas</div>
        <div style="margin-top:6px">${chips(enfermedades)}</div>
      </div>
      <div class="field">
        <div class="field-label">Medicamentos actuales</div>
        <div style="margin-top:6px">${chips(medicamentos)}</div>
      </div>
      <div class="field" style="grid-column:1/-1">
        <div class="field-label">Alergias conocidas</div>
        <div style="margin-top:6px">${chips(alergias,'danger')}</div>
      </div>
    </div>
  </div>

  <!-- Odontograma -->
  <div class="section">
    <div class="section-title"><div class="section-title-dot"></div>Estado del Odontograma</div>
    <div class="odontograma-box">
      <div class="odontograma-title">Dientes con condición registrada</div>
      <div style="line-height:2">${odontogramaHtml}</div>
    </div>
  </div>

  <!-- Firma -->
  <div class="sign-area">
    <div class="sign-box">
      <div style="height:40px"></div>
      <div class="sign-line">Dr./Dra. ____________________________<br/>Firma y sello del profesional</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span class="footer-brand">DentMed</span>
    <span>Expediente generado el ${fecha} · Documento confidencial</span>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=960,height=720');
  if (ventana) { ventana.document.write(html); ventana.document.close(); }
};

// ── Modal para registrar nuevo paciente ──────────────────────────────────────
const NuevoPacienteModal = ({ open, onClose, onCreado }) => {
  const [form, setForm] = useState({
    nombre: '', telefono: '', email: '', fecha_nacimiento: '',
    sexo: '', direccion: '', seguro_medico: '',
    contacto_emergencia: '', telefono_emergencia: '', alergias: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ nombre: '', telefono: '', email: '', fecha_nacimiento: '', sexo: '', direccion: '', seguro_medico: '', contacto_emergencia: '', telefono_emergencia: '', alergias: '' });
      setError('');
    }
  }, [open]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:3000/api/pacientes/crear-rapido', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error al crear paciente');
      onCreado(data?.data || data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(3px)', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
          <h3 className="dentista-titulo" style={{ margin: 0, color: '#111827' }}>
            <i className="fas fa-user-plus" style={{ marginRight: 8, color: '#4f46e5' }}></i>
            Nuevo paciente
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 22 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p className="dentista-label" style={{ margin: 0, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e0ebff', paddingBottom: 6 }}>
            Datos personales
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="dentista-label" style={{ color: '#374151' }}>Nombre completo <span style={{ color: '#dc2626' }}>*</span></label>
              <input name="nombre" value={form.nombre} onChange={handleChange} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
            </div>
            {[
              { label: 'Teléfono', name: 'telefono', type: 'text' },
              { label: 'Correo electrónico', name: 'email', type: 'email' },
              { label: 'Fecha de nacimiento', name: 'fecha_nacimiento', type: 'date' },
            ].map(f => (
              <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="dentista-label" style={{ color: '#374151' }}>{f.label}</label>
                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="dentista-label" style={{ color: '#374151' }}>Sexo</label>
              <select name="sexo" value={form.sexo} onChange={handleChange} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }}>
                <option value="">Seleccione</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="dentista-label" style={{ color: '#374151' }}>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
            </div>
          </div>
          <p className="dentista-label" style={{ margin: 0, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e0ebff', paddingBottom: 6 }}>
            Datos médicos
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Seguro médico', name: 'seguro_medico' },
              { label: 'Alergias conocidas', name: 'alergias' },
              { label: 'Contacto de emergencia', name: 'contacto_emergencia' },
              { label: 'Teléfono emergencia', name: 'telefono_emergencia' },
            ].map(f => (
              <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="dentista-label" style={{ color: '#374151' }}>{f.label}</label>
                <input name={f.name} value={form[f.name]} onChange={handleChange} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
              </div>
            ))}
          </div>
          {error && (
            <div className="dentista-texto-xpequeno" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 14px', fontWeight: 600 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: '#f1f5f9', color: '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#db2777)', color: 'white', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontSize: 14 }}>
              {saving ? 'Guardando...' : 'Guardar paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const MisPacientesScreen = ({ onSelectPatient, dentistaInfo, pacienteInicial }) => {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busquedasRecientes, setBusquedasRecientes] = useState(leerBusquedasRecientes());
  const [backendRecientes, setBackendRecientes] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [showNuevoPaciente, setShowNuevoPaciente] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    if (pacienteInicial) setPacienteSeleccionado(pacienteInicial);
  }, [pacienteInicial]);

  useEffect(() => {
    const cargarRecientes = async () => {
      try {
        const data = await obtenerPacientesRecientes();
        setBackendRecientes(data?.ids || []);
      } catch (error) { console.error('Error cargando pacientes recientes:', error); }
    };
    cargarRecientes();
  }, []);

  useEffect(() => {
    const hasSearch  = q.trim().length > 0;
    const hasFilters = Object.values(filtros).some((v) => String(v).trim() !== '');

    if (!hasSearch && !hasFilters) {
      const cargar = async () => {
        setLoading(true);
        try {
          const data = await buscarPacientes({ q: '', page, limit, filtros: {} });
          setRows(data?.data || []);
          setTotal(data?.total || 0);
        } catch (error) {
          console.error('Error cargando pacientes iniciales:', error);
          setRows([]); setTotal(0);
        } finally { setLoading(false); }
      };
      cargar();
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { id_dentista, ...filtrosSinDentista } = filtros;
        const data = await buscarPacientes({ q, page, limit, filtros: filtrosSinDentista });
        setRows(data?.data || []);
        setTotal(data?.total || 0);
        if (hasSearch || hasFilters) {
          const entry = { q: q.trim(), filtros, timestamp: new Date().toISOString() };
          guardarBusquedaReciente(entry);
          setBusquedasRecientes(leerBusquedasRecientes());
        }
      } catch (error) {
        console.error('Error buscando pacientes:', error);
        setRows([]); setTotal(0);
      } finally { setLoading(false); }
    }, 350);

    return () => clearTimeout(timer);
  }, [q, page, limit, filtros, reloadFlag]);

  const handleFiltroChange = (field, value) => { setPage(1); setFiltros((prev) => ({ ...prev, [field]: value })); };
  const limpiarFiltros     = () => { setPage(1); setFiltros({ ...filtrosIniciales }); };
  const aplicarBusquedaReciente = (item) => { setPage(1); setQ(item.q || ''); setFiltros(item.filtros || filtrosIniciales); };

  const handleSelectPaciente = async (paciente) => {
    try {
      const detalle = await obtenerPacienteDetalle(paciente.id);
      const formateado = {
        ...detalle,
        id_paciente: detalle.id || paciente.id,
        paciente_nombre: detalle.nombre_completo || detalle.nombre || paciente.nombre_completo || paciente.nombre,
      };
      setPacienteSeleccionado(formateado);
    } catch (error) {
      console.error('Error obteniendo detalle del paciente:', error);
      setPacienteSeleccionado({
        ...paciente,
        id_paciente: paciente.id,
        paciente_nombre: paciente.nombre_completo || paciente.nombre,
      });
    }
  };

  // ✅ CORREGIDO: Guardar odontograma — envía { estados: condiciones } como espera el backend
  const handleGuardarOdontograma = async (condiciones) => {
    const id = pacienteSeleccionado?.id_paciente || pacienteSeleccionado?.id;
    if (!id) throw new Error('No se encontró el ID del paciente');
    const token = localStorage.getItem('token') || '';
    const res = await fetch(`http://localhost:3000/api/pacientes/${id}/odontograma`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ estados: condiciones }), // ✅ CORREGIDO: "estados" como espera el backend
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Error al guardar odontograma');
    }
    setPacienteSeleccionado(prev => ({ ...prev, odontograma: condiciones }));
  };

  // ── Vista expediente completo ─────────────────────────────────────────────
  if (pacienteSeleccionado) {
    return (
      <div className="dm20-page">
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'12px 20px', background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #e9ecef', flexWrap:'wrap' }}>
          <button onClick={()=>setPacienteSeleccionado(null)}
            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#4f46e5', fontWeight:700 }} className="dentista-label">
            <i className="fas fa-arrow-left"></i> Volver a lista
          </button>
          <span style={{ color:'#d1d5db' }}>|</span>
          <span className="dentista-texto-pequeno" style={{ color:'#6b7280' }}>Mis Pacientes</span>
          <span style={{ color:'#d1d5db' }}>›</span>
          <span className="dentista-label" style={{ fontWeight:700, color:'#111827', flex:1 }}>
            {pacienteSeleccionado.paciente_nombre || pacienteSeleccionado.nombre_completo || 'Expediente'}
          </span>
          <button onClick={()=>exportarExpedientePDF(pacienteSeleccionado)} className="dentista-label"
            style={{ padding:'8px 16px', borderRadius:10, background:'white', color:'#dc2626', border:'1.5px solid #dc2626', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
            onMouseEnter={e=>{e.currentTarget.style.background='#dc2626';e.currentTarget.style.color='white';}}
            onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#dc2626';}}>
            <i className="fas fa-file-pdf"></i> Exportar expediente
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Odontograma paciente={pacienteSeleccionado} onGuardar={handleGuardarOdontograma}/>
        </div>

        <PatientTabs paciente={pacienteSeleccionado} onVerTodos={()=>{}} modoPanel={false}/>
      </div>
    );
  }

  // ── Vista lista ───────────────────────────────────────────────────────────
  return (
    <div className="dm20-page">
      <div className="dm20-card">
        <div className="dm20-header">
          <div>
            <h2>Mis Pacientes</h2>
            <p>Busca por nombre, apellido, teléfono o documento y aplica filtros avanzados.</p>
          </div>
          <button onClick={()=>setShowNuevoPaciente(true)} className="dentista-label"
            style={{ padding:'10px 18px', borderRadius:12, background:'linear-gradient(135deg,#4f46e5,#db2777)', color:'#fff', border:'none', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 6px 16px rgba(79,70,229,0.22)', whiteSpace:'nowrap' }}>
            <i className="fas fa-user-plus"></i> Nuevo paciente
          </button>
        </div>

        <div className="dm20-search-wrap">
          <input type="text" className="dm20-search-input"
            placeholder="Buscar por nombre, apellido, teléfono o documento..."
            value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }}/>
        </div>

        <div className="dm20-filters">
          <input type="number" placeholder="Edad mín." value={filtros.edad_min} onChange={(e)=>handleFiltroChange('edad_min',e.target.value)}/>
          <input type="number" placeholder="Edad máx." value={filtros.edad_max} onChange={(e)=>handleFiltroChange('edad_max',e.target.value)}/>
          <input type="date" value={filtros.fecha_ultima_visita_desde} onChange={(e)=>handleFiltroChange('fecha_ultima_visita_desde',e.target.value)}/>
          <input type="date" value={filtros.fecha_ultima_visita_hasta} onChange={(e)=>handleFiltroChange('fecha_ultima_visita_hasta',e.target.value)}/>
          <select value={filtros.activo} onChange={(e)=>handleFiltroChange('activo',e.target.value)}>
            <option value="">Estado</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
          <button type="button" onClick={limpiarFiltros}>Limpiar filtros</button>
        </div>

        {busquedasRecientes.length > 0 && (
          <div className="dm20-section">
            <h4>Búsquedas recientes</h4>
            <div className="dm20-tags">
              {busquedasRecientes.map((item,index)=>(
                <button key={`${item.q}-${index}`} className="dm20-tag" onClick={()=>aplicarBusquedaReciente(item)}>
                  {item.q||'Filtros avanzados'}
                </button>
              ))}
            </div>
          </div>
        )}

        {backendRecientes.length > 0 && (
          <div className="dm20-section">
            <h4>Pacientes consultados recientemente</h4>
            <p className="dm20-muted">IDs: {backendRecientes.join(', ')}</p>
          </div>
        )}

        <div className="dm20-results">
          {loading ? (
            <div className="dm20-empty">Buscando pacientes...</div>
          ) : rows.length === 0 ? (
            <div className="dm20-empty">No hay resultados.</div>
          ) : (
            <table className="dm20-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Edad</th>
                  <th>Última visita</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((paciente)=>(
                  <tr key={paciente.id}>
                    <td>{paciente.nombre_completo||paciente.nombre}</td>
                    <td>{paciente.documento||'-'}</td>
                    <td>{paciente.telefono||'-'}</td>
                    <td>{paciente.edad??'-'}</td>
                    <td>{formatearFecha(paciente.ultima_visita)}</td>
                    <td>
                      <span className={`dm20-status-badge ${String(paciente.activo_texto).toLowerCase()==='activo'?'activo':'inactivo'}`}>
                        {paciente.activo_texto||'-'}
                      </span>
                    </td>
                    <td>
                      <button onClick={()=>handleSelectPaciente(paciente)}
                        style={{ padding:'5px 14px', borderRadius:8, border:'1.5px solid #4f46e5', background:'transparent', color:'#4f46e5', fontWeight:700, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                        Ver expediente
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dm20-pagination">
          <button disabled={page<=1} onClick={()=>setPage(prev=>prev-1)}>Anterior</button>
          <span>Página {page} de {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(prev=>prev+1)}>Siguiente</button>
        </div>
      </div>

      <NuevoPacienteModal open={showNuevoPaciente} onClose={()=>setShowNuevoPaciente(false)}
        onCreado={()=>{ setShowNuevoPaciente(false); setPage(1); setReloadFlag(prev=>prev+1); }}/>
    </div>
  );
};

export default MisPacientesScreen;