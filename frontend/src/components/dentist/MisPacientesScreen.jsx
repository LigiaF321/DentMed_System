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
  id_dentista: '',
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

// ── Exportar expediente como PDF ──────────────────────────────────────────────
const exportarExpedientePDF = (paciente) => {
  const nombre = paciente.paciente_nombre || paciente.nombre_completo || paciente.nombre || 'Paciente';
  const edad   = paciente.edad ?? '-';
  const sexo   = paciente.sexo || paciente.genero || 'No especificado';
  const tel    = paciente.telefono || 'No registrado';
  const dir    = paciente.direccion || 'No registrada';
  const seguro = paciente.seguro_medico || paciente.aseguradora || 'No registrado';
  const contactoEmerg = paciente.contacto_emergencia || paciente.nombre_contacto_emergencia || 'No registrado';
  const telEmerg      = paciente.telefono_emergencia || paciente.contacto_emergencia_telefono || 'No registrado';

  const enfermedades = (paciente.enfermedades || paciente.condiciones_cronicas || '').toString() || 'Ninguna';
  const medicamentos = (paciente.medicamentos || paciente.medicamentos_actuales || '').toString() || 'Ninguno';
  const alergias     = (paciente.alergias || '').toString() || 'Ninguna';

  const fecha = new Date().toLocaleDateString('es-HN', { day:'2-digit', month:'long', year:'numeric' });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Expediente — ${nombre}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color:#1a2c3e; background:white; padding:32px; }

    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #2563eb; padding-bottom:16px; margin-bottom:24px; }
    .clinic-name { font-size:22px; font-weight:900; color:#2563eb; }
    .clinic-sub  { font-size:12px; color:#6b7280; margin-top:2px; }
    .doc-title   { text-align:right; }
    .doc-title h1{ font-size:18px; font-weight:800; color:#111827; }
    .doc-title p { font-size:11px; color:#6b7280; margin-top:3px; }

    .patient-card {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;
      border-left: 5px solid #2563eb;
    }
    .patient-name { font-size:20px; font-weight:900; color:#1e3a5f; }
    .patient-meta { font-size:12px; color:#4b6a8a; margin-top:4px; }

    .section { margin-bottom:20px; }
    .section-title {
      font-size:13px; font-weight:800; color:#2563eb;
      text-transform:uppercase; letter-spacing:0.06em;
      border-bottom:2px solid #dbeafe; padding-bottom:6px; margin-bottom:12px;
    }

    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .field   { background:#f8fafc; border-radius:8px; padding:10px 14px; border:1px solid #e2e8f0; }
    .field-label { font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px; }
    .field-value { font-size:14px; font-weight:600; color:#111827; }

    .alert-box {
      background:#fef2f2; border:1px solid #fecaca; border-radius:8px;
      padding:10px 14px; margin-bottom:12px;
      display:flex; align-items:center; gap:8px;
    }
    .alert-label { font-size:12px; font-weight:800; color:#dc2626; }
    .alert-value { font-size:13px; color:#7f1d1d; }

    .chip {
      display:inline-block; background:#dbeafe; color:#1d4ed8;
      padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700;
      margin:2px;
    }
    .chip.danger { background:#fee2e2; color:#dc2626; }

    .footer {
      margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb;
      display:flex; justify-content:space-between; font-size:11px; color:#9ca3af;
    }

    .sign-area {
      margin-top:40px; display:flex; justify-content:flex-end;
    }
    .sign-box {
      text-align:center; width:220px;
      border-top:1px solid #374151; padding-top:6px;
      font-size:11px; color:#374151;
    }

    @media print {
      body { padding:20px; }
      @page { margin:1.5cm; }
    }
  </style>
</head>
<body>

  <!-- Encabezado -->
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

  <!-- Tarjeta del paciente -->
  <div class="patient-card">
    <div class="patient-name">${nombre}</div>
    <div class="patient-meta">
      Edad: ${edad} años &nbsp;·&nbsp; Sexo: ${sexo}
      ${paciente.id || paciente.id_paciente ? `&nbsp;·&nbsp; ID: ${paciente.id || paciente.id_paciente}` : ''}
    </div>
  </div>

  <!-- Alerta de alergias -->
  ${alergias !== 'Ninguna' ? `
  <div class="alert-box">
    <span class="alert-label">⚠ ALERGIAS:</span>
    <span class="alert-value">${alergias}</span>
  </div>` : ''}

  <!-- Información personal -->
  <div class="section">
    <div class="section-title">Información Personal</div>
    <div class="grid-2">
      <div class="field"><div class="field-label">Teléfono</div><div class="field-value">${tel}</div></div>
      <div class="field"><div class="field-label">Dirección</div><div class="field-value">${dir}</div></div>
      <div class="field"><div class="field-label">Seguro médico</div><div class="field-value">${seguro}</div></div>
      <div class="field"><div class="field-label">Contacto emergencia</div><div class="field-value">${contactoEmerg}</div></div>
      <div class="field"><div class="field-label">Teléfono emergencia</div><div class="field-value">${telEmerg}</div></div>
    </div>
  </div>

  <!-- Historial médico -->
  <div class="section">
    <div class="section-title">Historial Médico</div>
    <div class="grid-2">
      <div class="field">
        <div class="field-label">Enfermedades / Condiciones crónicas</div>
        <div class="field-value" style="margin-top:4px">
          ${enfermedades.split(',').map(e => e.trim()).filter(Boolean).map(e => `<span class="chip">${e}</span>`).join('') || '<span style="color:#9ca3af;font-size:12px">Sin registros</span>'}
        </div>
      </div>
      <div class="field">
        <div class="field-label">Medicamentos actuales</div>
        <div class="field-value" style="margin-top:4px">
          ${medicamentos.split(',').map(m => m.trim()).filter(Boolean).map(m => `<span class="chip">${m}</span>`).join('') || '<span style="color:#9ca3af;font-size:12px">Sin registros</span>'}
        </div>
      </div>
      <div class="field" style="grid-column:1/-1">
        <div class="field-label">Alergias conocidas</div>
        <div class="field-value" style="margin-top:4px">
          ${alergias.split(',').map(a => a.trim()).filter(Boolean).map(a => `<span class="chip danger">${a}</span>`).join('') || '<span style="color:#9ca3af;font-size:12px">Ninguna registrada</span>'}
        </div>
      </div>
    </div>
  </div>

  <!-- Firma -->
  <div class="sign-area">
    <div class="sign-box">
      Dr./Dra. ____________________________<br/>
      Firma y sello del profesional
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>DentMed — Sistema de Gestión Clínica</span>
    <span>Expediente generado el ${fecha} · Documento confidencial</span>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=900,height=700');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  }
};

// ── Modal para registrar nuevo paciente (HU20) ────────────────────────────────
const NuevoPacienteModal = ({ open, onClose, onCreado }) => {
  const [form, setForm] = useState({
    nombre: '', telefono: '', email: '', fecha_nacimiento: '',
    sexo: '', direccion: '', seguro_medico: '',
    contacto_emergencia: '', telefono_emergencia: '', alergias: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (open) {
      setForm({ nombre:'', telefono:'', email:'', fecha_nacimiento:'', sexo:'', direccion:'', seguro_medico:'', contacto_emergencia:'', telefono_emergencia:'', alergias:'' });
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
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, backdropFilter:'blur(3px)', padding:16 }}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #e9ecef', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'white', zIndex:1 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'#111827' }}>
            <i className="fas fa-user-plus" style={{ marginRight:8, color:'#2563eb' }}></i>
            Nuevo paciente
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#6b7280' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'2px solid #e0ebff', paddingBottom:6 }}>
            Datos personales
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Nombre completo <span style={{ color:'#dc2626' }}>*</span></label>
              <input name="nombre" value={form.nombre} onChange={handleChange} style={{ padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:10, fontSize:14 }} />
            </div>
            {[
              { label:'Teléfono', name:'telefono', type:'text' },
              { label:'Correo electrónico', name:'email', type:'email' },
              { label:'Fecha de nacimiento', name:'fecha_nacimiento', type:'date' },
            ].map(f => (
              <div key={f.name} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{f.label}</label>
                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} style={{ padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:10, fontSize:14 }} />
              </div>
            ))}
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Sexo</label>
              <select name="sexo" value={form.sexo} onChange={handleChange} style={{ padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:10, fontSize:14 }}>
                <option value="">Seleccione</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} style={{ padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:10, fontSize:14 }} />
            </div>
          </div>

          <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'2px solid #e0ebff', paddingBottom:6 }}>
            Datos médicos
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { label:'Seguro médico', name:'seguro_medico' },
              { label:'Alergias conocidas', name:'alergias' },
              { label:'Contacto de emergencia', name:'contacto_emergencia' },
              { label:'Teléfono emergencia', name:'telefono_emergencia' },
            ].map(f => (
              <div key={f.name} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{f.label}</label>
                <input name={f.name} value={form[f.name]} onChange={handleChange} style={{ padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:10, fontSize:14 }} />
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600 }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'10px 22px', borderRadius:12, border:'none', background:'#f1f5f9', color:'#374151', fontWeight:700, cursor:'pointer', fontSize:14 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ padding:'10px 22px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'white', fontWeight:800, fontSize:14, cursor:'pointer', opacity: saving ? 0.6 : 1 }}>
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
  const [dentistaInicializado, setDentistaInicializado] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [showNuevoPaciente,    setShowNuevoPaciente]    = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    if (pacienteInicial) setPacienteSeleccionado(pacienteInicial);
  }, [pacienteInicial]);

  useEffect(() => {
    if (dentistaInfo?.id && !dentistaInicializado) {
      setFiltros((prev) => ({ ...prev, id_dentista: String(dentistaInfo.id) }));
      setDentistaInicializado(true);
    }
  }, [dentistaInfo, dentistaInicializado]);

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

    if (!hasSearch && !hasFilters) { setRows([]); setTotal(0); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await buscarPacientes({ q, page, limit, filtros });
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
  }, [q, page, limit, filtros]);

  const handleFiltroChange = (field, value) => { setPage(1); setFiltros((prev) => ({ ...prev, [field]: value })); };

  const limpiarFiltros = () => {
    setPage(1);
    setFiltros({ ...filtrosIniciales, id_dentista: dentistaInfo?.id ? String(dentistaInfo.id) : '' });
  };

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

  // ── Vista expediente completo ─────────────────────────────────────────────
  if (pacienteSeleccionado) {
    return (
      <div className="dm20-page">
        {/* Breadcrumb + botón exportar */}
        <div style={{
          display:'flex', alignItems:'center', gap:12, marginBottom:20,
          padding:'12px 20px', background:'white', borderRadius:16,
          boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #e9ecef',
          flexWrap:'wrap',
        }}>
          <button
            onClick={() => setPacienteSeleccionado(null)}
            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#2563eb', fontWeight:700, fontSize:14 }}
          >
            <i className="fas fa-arrow-left"></i> Volver a lista
          </button>
          <span style={{ color:'#d1d5db' }}>|</span>
          <span style={{ fontSize:14, color:'#6b7280' }}>Mis Pacientes</span>
          <span style={{ color:'#d1d5db' }}>›</span>
          <span style={{ fontSize:14, fontWeight:700, color:'#111827', flex:1 }}>
            {pacienteSeleccionado.paciente_nombre || pacienteSeleccionado.nombre_completo || 'Expediente'}
          </span>

          {/* ── Botón Exportar PDF ── */}
          <button
            onClick={() => exportarExpedientePDF(pacienteSeleccionado)}
            style={{
              padding:'8px 16px', borderRadius:10,
              background:'white', color:'#dc2626',
              border:'1.5px solid #dc2626', fontWeight:700, fontSize:13,
              cursor:'pointer', display:'flex', alignItems:'center', gap:6,
              transition:'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background='#dc2626'; e.currentTarget.style.color='white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background='white'; e.currentTarget.style.color='#dc2626'; }}
          >
            <i className="fas fa-file-pdf"></i> Exportar expediente
          </button>
        </div>

        {/* Odontograma */}
        <div style={{ marginBottom:20 }}>
          <Odontograma paciente={pacienteSeleccionado} />
        </div>

        {/* Expediente completo — modoPanel=false: edición habilitada */}
        <PatientTabs
          paciente={pacienteSeleccionado}
          onVerTodos={() => {}}
          modoPanel={false}
        />
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
          <button
            onClick={() => setShowNuevoPaciente(true)}
            style={{
              padding:'10px 18px', borderRadius:12,
              background:'linear-gradient(135deg,#2563eb,#3b82f6)',
              color:'#fff', border:'none', fontWeight:800, fontSize:14,
              cursor:'pointer', display:'flex', alignItems:'center', gap:8,
              boxShadow:'0 6px 16px rgba(37,99,235,0.22)', whiteSpace:'nowrap',
            }}
          >
            <i className="fas fa-user-plus"></i> Nuevo paciente
          </button>
        </div>

        <div className="dm20-search-wrap">
          <input
            type="text"
            className="dm20-search-input"
            placeholder="Buscar por nombre, apellido, teléfono o documento..."
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
          />
        </div>

        <div className="dm20-filters">
          <input type="number" placeholder="Edad mín." value={filtros.edad_min} onChange={(e) => handleFiltroChange('edad_min', e.target.value)} />
          <input type="number" placeholder="Edad máx." value={filtros.edad_max} onChange={(e) => handleFiltroChange('edad_max', e.target.value)} />
          <input type="date" value={filtros.fecha_ultima_visita_desde} onChange={(e) => handleFiltroChange('fecha_ultima_visita_desde', e.target.value)} />
          <input type="date" value={filtros.fecha_ultima_visita_hasta} onChange={(e) => handleFiltroChange('fecha_ultima_visita_hasta', e.target.value)} />
          <input type="number" placeholder="ID dentista" value={filtros.id_dentista} onChange={(e) => handleFiltroChange('id_dentista', e.target.value)} />
          <select value={filtros.activo} onChange={(e) => handleFiltroChange('activo', e.target.value)}>
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
              {busquedasRecientes.map((item, index) => (
                <button key={`${item.q}-${index}`} className="dm20-tag" onClick={() => aplicarBusquedaReciente(item)}>
                  {item.q || 'Filtros avanzados'}
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
                {rows.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>{paciente.nombre_completo || paciente.nombre}</td>
                    <td>{paciente.documento || '-'}</td>
                    <td>{paciente.telefono || '-'}</td>
                    <td>{paciente.edad ?? '-'}</td>
                    <td>{formatearFecha(paciente.ultima_visita)}</td>
                    <td>
                      <span className={`dm20-status-badge ${String(paciente.activo_texto).toLowerCase() === 'activo' ? 'activo' : 'inactivo'}`}>
                        {paciente.activo_texto || '-'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleSelectPaciente(paciente)}
                        style={{
                          padding:'5px 14px', borderRadius:8,
                          border:'1.5px solid #2563eb', background:'transparent',
                          color:'#2563eb', fontWeight:700, fontSize:12,
                          cursor:'pointer', whiteSpace:'nowrap',
                        }}
                      >
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
          <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Anterior</button>
          <span>Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Siguiente</button>
        </div>
      </div>

      <NuevoPacienteModal
        open={showNuevoPaciente}
        onClose={() => setShowNuevoPaciente(false)}
        onCreado={() => { setShowNuevoPaciente(false); setPage(1); }}
      />
    </div>
  );
};

export default MisPacientesScreen;