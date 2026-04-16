// frontend/src/components/dentist/NuevoTratamientoModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { obtenerMateriales } from "./tratamientos.service.jsx";
import './NuevoTratamientoModal.css';

const FORMAS_PAGO = ['Efectivo', 'Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Seguro médico', 'Otro'];

const BRAND = {
  primary:       '#4f46e5',
  secondary:     '#db2777',
  gradient:      'linear-gradient(135deg, #4f46e5, #db2777)',
  gradientHover: 'linear-gradient(135deg, #db2777, #4f46e5)',
  light:         '#f0effe',
  border:        '#c4b5fd',
};

const PALETTE = [
  { id: 'sano',        color: null,      label: 'Sano' },
  { id: 'caries',      color: '#E53935', label: 'Caries' },
  { id: 'planificado', color: '#FB8C00', label: 'Planificado' },
  { id: 'obturado',    color: '#43A047', label: 'Obturado' },
  { id: 'tratamiento', color: '#1E88E5', label: 'Tratamiento' },
  { id: 'extraido',    color: '#757575', label: 'Extraído' },
];

const DEFS = {
  upper_central:  { W:26, H:70, vW:34, vH:92, crown:`M7,0 L27,0 Q31,0 31,7 L29,37 Q17,45 5,37 L3,7 Q3,0 7,0Z`, roots:[`M5,37 Q17,45 29,37 L25,84 Q17,90 9,84Z`], overlay:`M8,1 L26,1 Q29,2 29,7 L27,31 Q17,37 7,31 L5,7 Q5,2 8,1Z`, xv:[17,19,12] },
  upper_lateral:  { W:20, H:67, vW:26, vH:88, crown:`M4,0 L22,0 Q25,1 25,7 Q25,21 23,35 Q13,42 3,35 Q1,21 1,7 Q1,1 4,0Z`, roots:[`M3,35 Q13,42 23,35 L20,81 Q13,87 6,81Z`], overlay:`M5,1 L21,1 Q23,2 23,7 Q23,19 21,30 Q13,35 5,30 Q3,19 3,7 Q3,2 5,1Z`, xv:[13,17,10] },
  upper_canine:   { W:24, H:76, vW:30, vH:100, crown:`M15,0 Q23,4 27,15 Q29,26 28,38 Q22,44 15,44 Q8,44 2,38 Q1,26 3,15 Q7,4 15,0Z`, roots:[`M2,38 Q8,44 15,44 Q22,44 28,38 L25,92 Q15,99 5,92Z`], overlay:`M15,3 Q22,7 25,16 Q27,26 26,36 Q21,41 15,41 Q9,41 4,36 Q3,26 5,16 Q8,7 15,3Z`, xv:[15,21,11] },
  upper_premolar: { W:30, H:69, vW:40, vH:91, crown:`M4,37 Q2,27 3,9 Q3,0 11,0 Q18,17 20,2 Q22,17 29,0 Q37,0 37,9 Q38,27 36,37 Q20,46 4,37Z`, roots:[`M5,39 Q11,46 17,46 L15,83 Q9,89 3,85Z`,`M23,46 Q29,46 35,39 L36,46 L35,83 Q29,89 23,85Z`], overlay:`M8,2 Q8,0 13,0 Q19,12 20,2 Q21,12 27,0 Q33,0 33,5 L33,20 Q20,25 8,20Z`, xv:[20,18,12] },
  upper_molar:    { W:43, H:69, vW:57, vH:91, crown:`M3,37 Q2,27 3,9 Q3,0 13,0 Q20,19 28,2 Q36,19 43,2 Q53,0 54,9 Q55,27 54,37 Q28,48 3,37Z`, roots:[`M4,39 Q10,47 17,47 L15,81 Q9,87 2,83Z`,`M21,47 Q28,45 35,47 L33,80 Q27,86 21,82Z`,`M39,47 Q46,45 53,39 L54,47 L52,81 Q45,87 39,83Z`], overlay:`M9,2 Q9,0 15,0 Q22,15 28,2 Q34,15 41,2 Q48,0 49,5 L49,21 Q28,27 9,21Z`, xv:[28,18,14] },
  lower_central:  { W:18, H:63, vW:22, vH:83, crown:`M2,0 L20,0 Q22,1 22,6 L20,31 Q11,36 2,31 L0,6 Q0,1 2,0Z`, roots:[`M2,31 Q11,36 20,31 L17,75 Q11,81 5,75Z`], overlay:`M3,1 L19,1 Q20,2 20,6 L18,25 Q11,29 4,25 L2,6 Q2,2 3,1Z`, xv:[11,14,9] },
  lower_lateral:  { W:20, H:65, vW:24, vH:85, crown:`M2,0 L22,0 Q24,1 24,6 L22,32 Q12,37 2,32 L0,6 Q0,1 2,0Z`, roots:[`M2,32 Q12,37 22,32 L18,78 Q12,84 6,78Z`], overlay:`M3,1 L21,1 Q22,2 22,6 L20,26 Q12,30 4,26 L2,6 Q2,2 3,1Z`, xv:[12,15,10] },
  lower_canine:   { W:22, H:73, vW:28, vH:95, crown:`M14,0 Q20,3 24,13 Q26,23 25,35 Q19,41 14,41 Q9,41 3,35 Q2,23 4,13 Q8,3 14,0Z`, roots:[`M3,35 Q9,41 14,41 Q19,41 25,35 L22,87 Q14,94 6,87Z`], overlay:`M14,3 Q19,6 22,14 Q24,23 23,33 Q18,38 14,38 Q10,38 5,33 Q4,23 6,14 Q9,6 14,3Z`, xv:[14,20,10] },
  lower_premolar: { W:26, H:66, vW:34, vH:87, crown:`M3,33 Q2,23 3,7 Q3,0 12,0 Q18,15 20,2 Q25,13 28,2 Q31,0 31,7 Q32,23 31,33 Q17,41 3,33Z`, roots:[`M4,35 Q17,41 30,35 L27,79 Q17,85 7,79Z`], overlay:`M6,2 Q6,0 13,0 Q18,11 20,2 Q25,10 27,2 Q28,0 28,5 L28,18 Q17,23 6,18Z`, xv:[17,17,11] },
  lower_molar:    { W:40, H:67, vW:52, vH:87, crown:`M2,33 Q1,23 2,7 Q2,0 11,0 Q18,15 26,1 Q34,15 40,1 Q49,0 50,7 Q51,23 50,33 Q26,43 2,33Z`, roots:[`M3,35 Q13,43 21,43 L19,79 Q12,85 4,81Z`,`M29,43 Q39,43 49,35 L50,43 L48,79 Q39,85 30,81Z`], overlay:`M7,2 Q7,0 13,0 Q20,11 26,1 Q32,11 38,1 Q45,0 46,5 L46,18 Q26,23 7,18Z`, xv:[26,16,14] },
};

const getToothType = (n) => {
  const upper = n >= 11 && n <= 28;
  if ([18,17,16,26,27,28,38,37,36,46,47,48].includes(n)) return upper ? 'upper_molar'    : 'lower_molar';
  if ([15,14,24,25,34,35,44,45].includes(n))             return upper ? 'upper_premolar' : 'lower_premolar';
  if ([13,23,33,43].includes(n))                         return upper ? 'upper_canine'   : 'lower_canine';
  if ([12,22,32,42].includes(n))                         return upper ? 'upper_lateral'  : 'lower_lateral';
  return upper ? 'upper_central' : 'lower_central';
};

const C = { highlight:'#EAF7FF', base:'#BFDDEA', midtone:'#7FAFC4', shadow:'#4B748D', stroke:'#1A3040' };

const ModalTooth = ({ numero, isUpper, condition, onToothClick }) => {
  const [hovered, setHovered] = useState(false);
  const type        = getToothType(numero);
  const def         = DEFS[type];
  const isExtracted = condition === 'extraido';
  const paletteItem = PALETTE.find(p => p.id === condition);
  const overlayColor = (!isExtracted && paletteItem?.color) ? paletteItem.color : null;
  const numColor     = (condition && condition !== 'sano' && paletteItem?.color) ? paletteItem.color : '#334E68';
  const gid          = `mt${numero}`;
  const [xcx,xcy,xcr] = def.xv;

  const svgContent = (
    <>
      <defs>
        <radialGradient id={gid} cx="35%" cy="20%" r="70%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor={C.highlight}/>
          <stop offset="30%"  stopColor={C.base}/>
          <stop offset="65%"  stopColor={C.midtone}/>
          <stop offset="100%" stopColor={C.shadow}/>
        </radialGradient>
      </defs>
      <g stroke={C.stroke} strokeWidth="1.2" strokeLinejoin="round">
        {def.roots.map((p,i)=><path key={i} d={p} fill={`url(#${gid})`} opacity="0.8"/>)}
      </g>
      <path d={def.crown} fill={`url(#${gid})`} stroke={C.stroke} strokeWidth="1.3" strokeLinejoin="round"/>
      {def.overlay && overlayColor && !isExtracted && (
        <path d={def.overlay} fill={overlayColor} stroke="none" opacity="0.82"/>
      )}
      {isExtracted && (
        <>
          <path d={def.crown} fill={C.shadow} stroke="none" opacity="0.35"/>
          <g stroke="#757575" strokeWidth="2.5" strokeLinecap="round">
            <line x1={xcx-xcr*0.68} y1={xcy-xcr*0.68} x2={xcx+xcr*0.68} y2={xcy+xcr*0.68}/>
            <line x1={xcx+xcr*0.68} y1={xcy-xcr*0.68} x2={xcx-xcr*0.68} y2={xcy+xcr*0.68}/>
          </g>
        </>
      )}
    </>
  );

  const scl = hovered ? 1.06 : 1;

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}} title={`Diente ${numero}${condition&&condition!=='sano'?` — ${paletteItem?.label}`:''}`}>
      {isUpper && (
        <svg width={def.W} height={def.H} viewBox={`0 0 ${def.vW} ${def.vH}`}
          style={{display:'block',cursor:'pointer',transform:`scaleY(-1) scale(${scl})`,transition:'transform 0.1s'}}
          onClick={()=>onToothClick(numero)}
          onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
          {svgContent}
        </svg>
      )}
      <span className="dentista-texto-xpequeno" style={{fontWeight:'700',color:numColor,display:'block',textAlign:'center',lineHeight:1,width:def.W,marginTop:isUpper?'2px':0,marginBottom:!isUpper?'2px':0}}>
        {numero}
      </span>
      {!isUpper && (
        <svg width={def.W} height={def.H} viewBox={`0 0 ${def.vW} ${def.vH}`}
          style={{display:'block',cursor:'pointer',transform:`scale(${scl})`,transition:'transform 0.1s'}}
          onClick={()=>onToothClick(numero)}
          onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
          {svgContent}
        </svg>
      )}
    </div>
  );
};

const OdontogramaModal = ({ teethStates, onToothClick, selectedPaint, onSelectPaint }) => {
  const UL = [18,17,16,15,14,13,12,11];
  const UR = [21,22,23,24,25,26,27,28];
  const LL = [48,47,46,45,44,43,42,41];
  const LR = [31,32,33,34,35,36,37,38];
  const getCond = (n) => teethStates[String(n)] ?? 'sano';

  const Row = ({ teeth, isUpper }) => (
    <div style={{display:'flex',justifyContent:'center',alignItems:isUpper?'flex-end':'flex-start',gap:'1px'}}>
      {teeth.slice(0,8).map(n=><ModalTooth key={n} numero={n} isUpper={isUpper} condition={getCond(n)} onToothClick={onToothClick}/>)}
      <div style={{width:'2px',alignSelf:'stretch',background:'#94A3B8',opacity:0.35,margin:'0 2px',flexShrink:0}}/>
      {teeth.slice(8).map(n=><ModalTooth key={n} numero={n} isUpper={isUpper} condition={getCond(n)} onToothClick={onToothClick}/>)}
    </div>
  );

  return (
    <div>
      <div style={{background:'linear-gradient(180deg,#E8EFF6,#DDE6EF)',borderRadius:10,padding:'10px 6px',border:`1px solid ${BRAND.border}`,overflowX:'auto'}}>
        <div style={{minWidth:'max-content'}}>
          <Row teeth={[...UL,...UR]} isUpper={true}/>
          <div style={{height:'2px',background:`linear-gradient(90deg,transparent,${BRAND.primary}44,transparent)`,margin:'5px 10px'}}/>
          <Row teeth={[...LL,...LR]} isUpper={false}/>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'center',marginTop:10}}>
        <div style={{background:'white',borderRadius:'40px',padding:'6px 14px',boxShadow:'0 3px 16px rgba(0,0,0,0.13)',display:'flex',gap:'10px',alignItems:'center',border:'1px solid #E9EEF3'}}>
          {PALETTE.map(opt=>{
            const active = selectedPaint === opt.id;
            return (
              <button key={opt.id} title={opt.label}
                onClick={()=>onSelectPaint(p=>p===opt.id?null:opt.id)}
                style={{width:'26px',height:'26px',borderRadius:'50%',background:opt.color??'#F3F4F6',border:active?'3px solid #1E88E5':`1.5px solid ${opt.color?opt.color+'AA':'#9CA3AF'}`,cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center',transform:active?'scale(1.25)':'scale(1)',transition:'transform .15s',boxSizing:'border-box',boxShadow:active?'0 0 0 2px white, 0 0 0 4px #1E88E5':'0 1px 3px rgba(0,0,0,0.15)'}}>
                {opt.id==='sano'    && <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3.5" fill="none" stroke="#9CA3AF" strokeWidth="1.3"/></svg>}
                {opt.id==='extraido'&& <svg width="12" height="12" viewBox="0 0 12 12"><line x1="3" y1="3" x2="9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="3" x2="3" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>}
              </button>
            );
          })}
        </div>
      </div>
      {selectedPaint && (
        <p className="dentista-texto-xpequeno" style={{textAlign:'center',color:'#6B7280',margin:'4px 0 0',fontStyle:'italic'}}>
          Aplicando{' '}
          <strong style={{color:PALETTE.find(p=>p.id===selectedPaint)?.color??'#374151',fontStyle:'normal'}}>
            {PALETTE.find(p=>p.id===selectedPaint)?.label}
          </strong>
          {' '}— haz clic en un diente
        </p>
      )}
      <div style={{display:'flex',justifyContent:'center',flexWrap:'wrap',gap:'4px 10px',marginTop:8,padding:'6px 0 0',borderTop:'1px solid #EEF2F7'}}>
        {PALETTE.filter(p=>p.id!=='sano').map(opt=>(
          <div key={opt.id} className="dentista-texto-xpequeno" style={{display:'flex',alignItems:'center',gap:'3px',color:'#4B5563'}}>
            <span style={{width:'8px',height:'8px',borderRadius:'2px',background:opt.color??'#4B5563',display:'inline-block',flexShrink:0}}/>
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Buscador de paciente ──────────────────────────────────────────────────────
const BuscadorPaciente = ({ onSelect }) => {
  const [query,      setQuery]      = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando,   setBuscando]   = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResultados([]); return; }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/pacientes/buscar?q=${encodeURIComponent(query)}&limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setResultados(data?.data || []);
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ position:'relative' }}>
      <div style={{ position:'relative' }}>
        <i className="fas fa-search dentista-texto-pequeno" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar paciente por nombre, teléfono..."
          style={{ width:'100%', padding:'10px 12px 10px 34px', border:`1.5px solid ${BRAND.border}`, borderRadius:10, fontSize:14, boxSizing:'border-box', outline:'none' }}
          autoFocus
        />
        {buscando && <i className="fas fa-spinner fa-spin dentista-texto-pequeno" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:BRAND.primary }}/>} 
      </div>

      {resultados.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', border:'1px solid #e9ecef', zIndex:10, maxHeight:220, overflowY:'auto' }}>
          {resultados.map(p => (
            <div key={p.id}
              onClick={() => { onSelect(p); setQuery(''); setResultados([]); }}
              style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:10, transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND.light}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ width:32, height:32, borderRadius:'50%', background:BRAND.gradient, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="fas fa-user dentista-texto-pequeno" style={{ color:'white' }}/>
              </div>
              <div>
                <div className="dentista-label" style={{ fontWeight:700, color:'#111827' }}>{p.nombre_completo || p.nombre}</div>
                <div className="dentista-texto-xpequeno" style={{ color:'#6b7280' }}>{p.telefono || ''} {p.edad ? `· ${p.edad} años` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !buscando && resultados.length === 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'white', borderRadius:10, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', border:'1px solid #e9ecef', zIndex:10, padding:'12px 14px', color:'#6b7280', textAlign:'center' }} className="dentista-texto-pequeno">
          No se encontraron pacientes
        </div>
      )}
    </div>
  );
};

// ── Modal principal ───────────────────────────────────────────────────────────
export default function NuevoTratamientoModal({ open, onClose, onCreated, pacienteId: pacienteIdProp, pacienteNombre: pacienteNombreProp, onPacienteSeleccionado }) {

  // ── NUEVO: estado interno del paciente seleccionado (cuando no viene por prop) ──
  const [pacienteIdLocal,     setPacienteIdLocal]     = useState(null);
  const [pacienteNombreLocal, setPacienteNombreLocal] = useState('');

  // El paciente activo es el de la prop si existe, si no el seleccionado localmente
  const pacienteId     = pacienteIdProp     || pacienteIdLocal;
  const pacienteNombre = pacienteNombreProp || pacienteNombreLocal;

  const [form, setForm] = useState({
    diagnostico:'', procedimiento:'', dientes:[], dienteEstados:{}, observaciones:'',
    costo:'', forma_pago:'Efectivo', es_multisesion:false, sesiones_estimadas:2, estado:'planificado',
  });
  const [selectedPaint, setSelectedPaint] = useState(null);
  const [materiales, setMateriales] = useState([]);
  const [queryMat,   setQueryMat]   = useState('');
  const [matSelec,   setMatSelec]   = useState([]);
  const [archivos,   setArchivos]   = useState([]);
  const [dragOver,   setDragOver]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const inputFileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    obtenerMateriales()
      .then(data=>setMateriales(Array.isArray(data?.data)?data.data:[]))
      .catch(()=>setMateriales([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Resetear todo al abrir
    setForm({diagnostico:'',procedimiento:'',dientes:[],dienteEstados:{},observaciones:'',costo:'',forma_pago:'Efectivo',es_multisesion:false,sesiones_estimadas:2,estado:'planificado'});
    setSelectedPaint(null);
    setQueryMat(''); setMatSelec([]); setArchivos([]); setDragOver(false); setError('');
    // Solo resetear paciente local si no viene por prop
    if (!pacienteIdProp) { setPacienteIdLocal(null); setPacienteNombreLocal(''); }
  }, [open]);

  const handleChange = (e) => {
    const {name,value,type,checked} = e.target;
    setError('');
    setForm(prev=>({...prev,[name]:type==='checkbox'?checked:value}));
  };

  const handleToothClick = (n) => {
    if (!selectedPaint) return;
    const key = String(n);
    setForm(prev => {
      const nuevosEstados = { ...prev.dienteEstados, [key]: selectedPaint };
      if (selectedPaint === 'sano') delete nuevosEstados[key];
      const dientesMarcados = Object.keys(nuevosEstados).map(Number);
      return { ...prev, dienteEstados: nuevosEstados, dientes: dientesMarcados };
    });
  };

  // ── NUEVO: cuando se selecciona un paciente desde el buscador ──
  const handlePacienteSeleccionado = (p) => {
    const id     = p.id || p.id_paciente;
    const nombre = p.nombre_completo || p.nombre || 'Paciente';
    setPacienteIdLocal(id);
    setPacienteNombreLocal(nombre);
    if (onPacienteSeleccionado) onPacienteSeleccionado(id, nombre);
  };

  const matFiltrados  = materiales.filter(m=>m.nombre?.toLowerCase().includes(queryMat.toLowerCase())&&!matSelec.find(s=>s.id===m.id));
  const agregarMat    = (m) => { setMatSelec(prev=>[...prev,{id:m.id,nombre:m.nombre,unidad:m.unidad||'unidad',cantidad:1}]); setQueryMat(''); };
  const quitarMat     = (id) => setMatSelec(prev=>prev.filter(m=>m.id!==id));
  const cambiarCant   = (id,val) => setMatSelec(prev=>prev.map(m=>m.id===id?{...m,cantidad:Math.max(1,Number(val))}:m));
  const handleDrop    = useCallback((e)=>{e.preventDefault();setDragOver(false);setArchivos(prev=>[...prev,...Array.from(e.dataTransfer.files)]);}, []);
  const handleFileIn  = (e)=>setArchivos(prev=>[...prev,...Array.from(e.target.files)]);
  const quitarArch    = (idx)=>setArchivos(prev=>prev.filter((_,i)=>i!==idx));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!pacienteId)              { setError('Debes seleccionar un paciente.'); return; }
    if (!form.diagnostico.trim()) { setError('El diagnóstico es obligatorio.'); return; }
    if (!form.procedimiento.trim()) { setError('El procedimiento es obligatorio.'); return; }
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('id_paciente',        pacienteId);
      fd.append('diagnostico',        form.diagnostico.trim());
      fd.append('procedimiento',      form.procedimiento.trim());
      fd.append('dientes',            JSON.stringify(form.dientes));
      fd.append('diente_estados',     JSON.stringify(form.dienteEstados));
      fd.append('observaciones',      form.observaciones.trim());
      fd.append('costo',              form.costo||0);
      fd.append('forma_pago',         form.forma_pago);
      fd.append('es_multisesion',     form.es_multisesion);
      fd.append('sesiones_estimadas', form.es_multisesion?form.sesiones_estimadas:1);
      fd.append('estado',             form.estado);
      fd.append('materiales',         JSON.stringify(matSelec.map(m=>({id:m.id,cantidad:m.cantidad}))));
      archivos.forEach(file=>fd.append('radiografias',file));
      const token = localStorage.getItem('token')||'';
      const res = await fetch('http://localhost:3000/api/tratamientos',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd});
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message||'No se pudo crear el tratamiento');
      if (onCreated) onCreated(data);
      onClose();
    } catch(err) { setError(err.message||'Error al guardar'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const sectionTitle = {
    fontSize:12, fontWeight:800, color:BRAND.primary,
    textTransform:'uppercase', letterSpacing:'0.08em',
    borderBottom:`2px solid ${BRAND.light}`, paddingBottom:6, margin:'0 0 14px',
  };

  const dientesMarcados = Object.entries(form.dienteEstados);

  return (
    <div className="nt-overlay">
      <div className="nt-modal">

        <div className="nt-header" style={{borderBottom:`2px solid ${BRAND.light}`}}>
          <h3 style={{display:'flex',alignItems:'center',gap:8}}>
            <i className="fas fa-tooth" style={{color:BRAND.primary}}></i>
            Nuevo Tratamiento
          </h3>
          <button type="button" className="nt-close" onClick={onClose}>×</button>
        </div>

        <form className="nt-form" onSubmit={handleSubmit}>

          {/* ── NUEVO: Selector de paciente (solo si no viene por prop) ── */}
          {!pacienteIdProp && (
            <div>
              <p style={sectionTitle}>Paciente</p>
              {!pacienteId ? (
                <BuscadorPaciente onSelect={handlePacienteSeleccionado} />
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:BRAND.light, borderRadius:10, border:`1.5px solid ${BRAND.border}` }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:BRAND.gradient, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className="fas fa-user dentista-texto-pequeno" style={{ color:'white' }}/>
                  </div>
                  <span className="dentista-label" style={{ fontWeight:700, color:'#111827', flex:1 }}>{pacienteNombre}</span>
                  <button type="button"
                    onClick={() => { setPacienteIdLocal(null); setPacienteNombreLocal(''); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', lineHeight:1 }}>×</button>
                </div>
              )}
            </div>
          )}

          {/* ── El resto del formulario solo se muestra si hay paciente ── */}
          {pacienteId && (
            <>
              {/* Paciente seleccionado por prop — mostrar nombre */}
              {pacienteIdProp && pacienteNombre && (
                <div style={{ padding:'8px 14px', background:BRAND.light, borderRadius:10, border:`1.5px solid ${BRAND.border}`, color:BRAND.primary, fontWeight:700, marginBottom:4 }} className="dentista-texto-pequeno">
                  <i className="fas fa-user" style={{ marginRight:8 }}/>
                  {pacienteNombre}
                </div>
              )}

              {/* Información clínica */}
              <div>
                <p style={sectionTitle}>Información clínica</p>
                <div className="nt-grid">
                  <div className="nt-field nt-field-full">
                    <label>Diagnóstico <span className="required">*</span></label>
                    <input name="diagnostico" value={form.diagnostico} onChange={handleChange} placeholder="Ej. Caries profunda en diente 16" required/>
                  </div>
                  <div className="nt-field nt-field-full">
                    <label>Procedimiento <span className="required">*</span></label>
                    <input name="procedimiento" value={form.procedimiento} onChange={handleChange} placeholder="Ej. Obturación, endodoncia, extracción..." required/>
                  </div>
                  <div className="nt-field">
                    <label>Estado del tratamiento</label>
                    <select name="estado" value={form.estado} onChange={handleChange}>
                      <option value="planificado">Planificado</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="realizado">Realizado</option>
                    </select>
                  </div>
                  <div className="nt-field">
                    <label>Observaciones</label>
                    <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Notas adicionales sobre el tratamiento..." rows={3}/>
                  </div>
                </div>
              </div>

              {/* Dientes afectados */}
              <div>
                <p style={sectionTitle}>Dientes afectados</p>
                <p className="dentista-texto-xpequeno" style={{color:'#6b7280',margin:'0 0 8px'}}>
                  Selecciona un color y haz clic en los dientes afectados
                </p>
                <OdontogramaModal
                  teethStates={form.dienteEstados}
                  onToothClick={handleToothClick}
                  selectedPaint={selectedPaint}
                  onSelectPaint={setSelectedPaint}
                />
                {dientesMarcados.length > 0 && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:8,alignItems:'center'}}>
                    <span className="dentista-texto-xpequeno" style={{color:'#6b7280'}}>Marcados:</span>
                    {dientesMarcados.map(([n, est]) => {
                      const pal = PALETTE.find(p=>p.id===est);
                      return (
                        <span key={n} className="dentista-texto-xpequeno" style={{background:pal?.color?pal.color+'22':BRAND.light,color:pal?.color??BRAND.primary,padding:'2px 8px',borderRadius:20,fontWeight:700,display:'flex',alignItems:'center',gap:4,border:`1px solid ${pal?.color?pal.color+'44':BRAND.border}`}}>
                          {n} · {pal?.label}
                          <button type="button"
                            onClick={()=>setForm(prev=>{const e={...prev.dienteEstados};delete e[String(n)];return{...prev,dienteEstados:e,dientes:Object.keys(e).map(Number)};})}
                            style={{background:'none',border:'none',cursor:'pointer',color:pal?.color??BRAND.primary,padding:0,lineHeight:1}}>×</button>
                        </span>
                      );
                    })}
                    <button type="button"
                      onClick={()=>setForm(prev=>({...prev,dienteEstados:{},dientes:[]}))}
                      className="dentista-texto-xpequeno" style={{color:'#dc2626',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',padding:0}}>
                      Limpiar todo
                    </button>
                  </div>
                )}
              </div>

              {/* Materiales */}
              <div>
                <p style={sectionTitle}>Materiales utilizados</p>
                <input style={{padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:10,fontSize:14,width:'100%',boxSizing:'border-box'}}
                  placeholder="Buscar material..." value={queryMat} onChange={e=>setQueryMat(e.target.value)}/>
                {queryMat && matFiltrados.length>0 && (
                  <div className="nt-mat-results">
                    {matFiltrados.slice(0,8).map(m=>(
                      <div key={m.id} className="nt-mat-item" onClick={()=>agregarMat(m)}>
                        <span>{m.nombre}</span><small>{m.stock??''} {m.unidad||''} disponibles</small>
                      </div>
                    ))}
                  </div>
                )}
                {matSelec.length>0 && (
                  <div className="nt-mat-selected">
                    {matSelec.map(m=>(
                      <div key={m.id} className="nt-mat-row">
                        <span>{m.nombre}</span>
                        <input type="number" min={1} value={m.cantidad} onChange={e=>cambiarCant(m.id,e.target.value)}/>
                        <span className="dentista-texto-xpequeno" style={{color:'#6b7280'}}>{m.unidad}</span>
                        <button type="button" onClick={()=>quitarMat(m.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {matSelec.length===0&&!queryMat&&<p className="dentista-texto-xpequeno" style={{color:'#9ca3af',margin:'6px 0 0'}}>Busca y agrega materiales utilizados en este tratamiento.</p>}
              </div>

              {/* Costo */}
              <div>
                <p style={sectionTitle}>Costo y pago</p>
                <div className="nt-grid">
                  <div className="nt-field">
                    <label>Costo (L)</label>
                    <input type="number" name="costo" value={form.costo} onChange={handleChange} placeholder="0.00" min="0" step="0.01"/>
                  </div>
                  <div className="nt-field">
                    <label>Forma de pago</label>
                    <select name="forma_pago" value={form.forma_pago} onChange={handleChange}>
                      {FORMAS_PAGO.map(f=><option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sesiones */}
              <div>
                <p style={sectionTitle}>Sesiones</p>
                <label className="nt-multisesion-check">
                  <input type="checkbox" name="es_multisesion" checked={form.es_multisesion} onChange={handleChange}/>
                  Tratamiento multi-sesión
                </label>
                {form.es_multisesion && (
                  <div className="nt-field" style={{marginTop:10,maxWidth:200}}>
                    <label>Sesiones estimadas</label>
                    <input type="number" name="sesiones_estimadas" value={form.sesiones_estimadas} onChange={handleChange} min={2} max={20}/>
                  </div>
                )}
              </div>

              {/* Radiografías */}
              <div>
                <p style={sectionTitle}>Radiografías y documentos</p>
                <div className={`nt-dropzone ${dragOver?'over':''}`}
                  style={{borderColor:dragOver?BRAND.primary:undefined}}
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={()=>inputFileRef.current?.click()}>
                  <i className="fas fa-cloud-upload-alt" style={{color:BRAND.primary}}></i>
                  <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                  <small>PNG, JPG, PDF — máx. 10 MB por archivo</small>
                </div>
                <input ref={inputFileRef} type="file" multiple accept="image/*,.pdf" style={{display:'none'}} onChange={handleFileIn}/>
                {archivos.length>0 && (
                  <div className="nt-files-preview">
                    {archivos.map((f,i)=>(
                      <div key={i} className="nt-file-chip">
                        <i className="fas fa-file" style={{fontSize:11,color:BRAND.primary}}></i>
                        <span style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                        <button type="button" onClick={()=>quitarArch(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Si no hay paciente seleccionado, mostrar mensaje */}
          {!pacienteId && pacienteIdProp === undefined && (
            <div style={{ textAlign:'center', padding:'24px', color:'#9ca3af' }} className="dentista-texto-pequeno">
              <i className="fas fa-user-circle" style={{ fontSize:32, display:'block', marginBottom:8, opacity:0.4 }}/>
              Busca y selecciona un paciente para continuar
            </div>
          )}

          {error && <div className="nt-error dentista-texto-xpequeno"><i className="fas fa-exclamation-circle"></i> {error}</div>}

          <div className="nt-actions">
            <button type="button" className="nt-btn nt-btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="nt-btn nt-btn-primary" disabled={saving || !pacienteId}
              style={{background:(saving||!pacienteId)?'#9ca3af':BRAND.gradient,border:'none',cursor:(!pacienteId)?'not-allowed':'pointer'}}
              onMouseEnter={e=>{if(!saving&&pacienteId)e.currentTarget.style.background=BRAND.gradientHover;}}
              onMouseLeave={e=>{if(!saving&&pacienteId)e.currentTarget.style.background=BRAND.gradient;}}>
              {saving?'Guardando...':'Guardar tratamiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}