// frontend/src/components/dentist/Odontograma.jsx
import React, { useState, useEffect } from 'react';

const PALETTE = [
  { id: 'sano',        color: null,      label: 'Sano' },
  { id: 'caries',      color: '#E53935', label: 'Caries' },
  { id: 'planificado', color: '#FB8C00', label: 'Planificado' },
  { id: 'obturado',    color: '#43A047', label: 'Obturado' },
  { id: 'tratamiento', color: '#1E88E5', label: 'Tratamiento' },
  { id: 'extraido',    color: '#757575', label: 'Extraído' },
];

const INITIAL_TEETH = {};

const getToothType = (n) => {
  const upper = n >= 11 && n <= 28;
  if ([18,17,16,26,27,28,38,37,36,46,47,48].includes(n)) return upper ? 'upper_molar'    : 'lower_molar';
  if ([15,14,24,25,34,35,44,45].includes(n))             return upper ? 'upper_premolar' : 'lower_premolar';
  if ([13,23,33,43].includes(n))                         return upper ? 'upper_canine'   : 'lower_canine';
  if ([12,22,32,42].includes(n))                         return upper ? 'upper_lateral'  : 'lower_lateral';
  return upper ? 'upper_central' : 'lower_central';
};

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

const C = { highlight:'#EAF7FF', base:'#BFDDEA', midtone:'#7FAFC4', shadow:'#4B748D', stroke:'#1A3040', detail:'#365465' };

const ToothSVG = ({ def, numero, overlayColor, isExtracted, hovered }) => {
  const [xcx,xcy,xcr] = def.xv;
  const gid   = `enamel_${numero}`;
  const lgid  = `lin_${numero}`;
  const glowId = `glow_${numero}`;
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="35%" cy="20%" r="70%" fx="30%" fy="15%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor={C.highlight}/>
          <stop offset="30%"  stopColor={C.base}/>
          <stop offset="65%"  stopColor={C.midtone}/>
          <stop offset="100%" stopColor={C.shadow}/>
        </radialGradient>
        <linearGradient id={lgid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={C.highlight} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={C.shadow}    stopOpacity="0.3"/>
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feFlood floodColor="#1E88E5" floodOpacity="0.55" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter={hovered ? `url(#${glowId})` : undefined}>
        <g stroke={C.stroke} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
          {def.roots.map((p,i)=><path key={i} d={p} fill={`url(#${gid})`} style={{filter:'brightness(0.88)'}}/>)}
        </g>
        <path d={def.crown} fill={`url(#${gid})`} stroke={C.stroke} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round"/>
        <path d={def.crown} fill={`url(#${lgid})`} stroke="none" opacity="0.5"/>
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
      </g>
    </>
  );
};

// ── Diente ────────────────────────────────────────────────────────────────────
const Tooth = ({ numero, isUpper, condition, onToothClick, soloLectura }) => {
  const [hovered, setHovered] = useState(false);
  const type        = getToothType(numero);
  const def         = DEFS[type];
  const isExtracted = condition === 'extraido';
  const paletteItem = PALETTE.find(p => p.id === condition);
  const overlayColor = (!isExtracted && paletteItem?.color) ? paletteItem.color : null;
  const numColor     = (condition && condition !== 'sano' && paletteItem?.color) ? paletteItem.color : '#334E68';

  const svgBase = {
    display:'block', flexShrink:0,
    cursor: soloLectura ? 'default' : 'pointer',
    transition:'transform 0.12s',
    transform: (!soloLectura && hovered) ? 'scale(1.06)' : 'scale(1)',
  };

  const handleClick  = () => { if (!soloLectura) onToothClick(numero); };
  const handleEnter  = () => { if (!soloLectura) setHovered(true); };
  const handleLeave  = () => { if (!soloLectura) setHovered(false); };

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}} title={`Diente ${numero}${condition && condition!=='sano' ? ` — ${paletteItem?.label}` : ''}`}>
      {isUpper && (
        <svg width={def.W} height={def.H} viewBox={`0 0 ${def.vW} ${def.vH}`}
          style={{...svgBase, transform:`scaleY(-1) scale(${(!soloLectura&&hovered)?1.06:1})`}}
          onClick={handleClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
          <ToothSVG def={def} numero={numero} overlayColor={overlayColor} isExtracted={isExtracted} hovered={!soloLectura&&hovered}/>
        </svg>
      )}
      <span className="dentista-texto-xpequeno" style={{fontWeight:'700',color:numColor,display:'block',textAlign:'center',lineHeight:1,width:def.W,marginTop:isUpper?'3px':0,marginBottom:!isUpper?'3px':0,fontFamily:"'Segoe UI', sans-serif"}}>
        {numero}
      </span>
      {!isUpper && (
        <svg width={def.W} height={def.H} viewBox={`0 0 ${def.vW} ${def.vH}`}
          style={svgBase}
          onClick={handleClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
          <ToothSVG def={def} numero={numero} overlayColor={overlayColor} isExtracted={isExtracted} hovered={!soloLectura&&hovered}/>
        </svg>
      )}
    </div>
  );
};

// ── Odontograma principal ─────────────────────────────────────────────────────
// soloLectura = true  → sin paleta, sin clic (panel Mi Agenda)
// soloLectura = false → interactivo completo con botón Guardar (Mis Pacientes)
// onGuardar(condiciones) → callback que recibe el objeto {diente: condicion} actualizado
const Odontograma = ({ paciente, soloLectura = false, onGuardar }) => {
  const [teethStates,   setTeethStates]   = useState(INITIAL_TEETH);
  const [selectedPaint, setSelectedPaint] = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [savedMsg,      setSavedMsg]      = useState('');
  const [hasChanges,    setHasChanges]    = useState(false);

  // ── NUEVO: inicializar desde paciente.odontograma cuando cambia el paciente ──
  useEffect(() => {
    if (paciente?.odontograma && typeof paciente.odontograma === 'object') {
      setTeethStates(paciente.odontograma);
    } else {
      setTeethStates(INITIAL_TEETH);
    }
    setHasChanges(false);
    setSavedMsg('');
    setSelectedPaint(null);
  }, [paciente?.id_paciente || paciente?.id]);

  const handleToothClick = (n) => {
    if (soloLectura || !selectedPaint) return;
    setTeethStates(prev => ({ ...prev, [String(n)]: selectedPaint }));
    setHasChanges(true);
  };

  // ── NUEVO: llamar onGuardar con el estado actual ──
  const handleGuardar = async () => {
    if (!onGuardar) return;
    try {
      setSaving(true);
      await onGuardar(teethStates);
      setHasChanges(false);
      setSavedMsg('¡Odontograma guardado!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      setSavedMsg('Error al guardar');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getCond = (n) => teethStates[String(n)] ?? 'sano';

  const upperLeft  = [18,17,16,15,14,13,12,11];
  const upperRight = [21,22,23,24,25,26,27,28];
  const lowerLeft  = [48,47,46,45,44,43,42,41];
  const lowerRight = [31,32,33,34,35,36,37,38];

  if (!paciente) return (
    <div style={{padding:'20px',textAlign:'center',color:'#9CA3AF',background:'#F9FAFB',borderRadius:'10px',border:'1px dashed #D1D5DB'}}>
      <i className="fas fa-tooth" style={{fontSize:28,marginBottom:8,display:'block',opacity:0.3}}></i>
      <p className="dentista-texto-xpequeno" style={{margin:0}}>Seleccione un paciente para ver su odontograma</p>
    </div>
  );

  const ArchRow = ({ teeth, isUpper }) => (
    <div style={{display:'flex',justifyContent:'center',alignItems:isUpper?'flex-end':'flex-start',gap:'2px'}}>
      {teeth.slice(0,8).map(n => <Tooth key={n} numero={n} isUpper={isUpper} condition={getCond(n)} onToothClick={handleToothClick} soloLectura={soloLectura}/>)}
      <div style={{width:'2px',alignSelf:'stretch',background:'#94A3B8',opacity:0.35,margin:'0 3px',flexShrink:0}}/>
      {teeth.slice(8).map(n => <Tooth key={n} numero={n} isUpper={isUpper} condition={getCond(n)} onToothClick={handleToothClick} soloLectura={soloLectura}/>)}
    </div>
  );

  return (
    <div style={{background:'white',borderRadius:'12px',padding:'14px 12px 12px',fontFamily:"'Segoe UI', system-ui, sans-serif",maxWidth:'100%',boxSizing:'border-box',boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>

      {/* Nombre del paciente */}
      <div style={{marginBottom:'10px',display:'flex',alignItems:'center',gap:8}}>
        <i className="fas fa-tooth dentista-texto-pequeno" style={{color:'#1E88E5'}}></i>
        <span className="dentista-label" style={{fontWeight:'800',color:'#1A3040'}}>
          {paciente.paciente_nombre}
        </span>
        {soloLectura && (
          <span className="dentista-texto-xpequeno" style={{color:'#9ca3af',marginLeft:'auto',fontStyle:'italic'}}>Solo lectura</span>
        )}
      </div>

      {/* Grilla dental */}
      <div style={{background:'linear-gradient(180deg,#E8EFF6 0%,#DDE6EF 100%)',borderRadius:'10px',padding:'10px 6px',border:'1px solid #C8D8E4',overflowX:'auto'}}>
        <div style={{minWidth:'max-content'}}>
          <ArchRow teeth={[...upperLeft,...upperRight]} isUpper={true}/>
          <div style={{height:'2px',background:'linear-gradient(90deg,transparent,#94A3B8,transparent)',margin:'6px 12px',opacity:0.5}}/>
          <ArchRow teeth={[...lowerLeft,...lowerRight]} isUpper={false}/>
        </div>
      </div>

      {/* Paleta — solo en modo interactivo */}
      {!soloLectura && (
        <>
          <div style={{display:'flex',justifyContent:'center',marginTop:'12px'}}>
            <div style={{background:'white',borderRadius:'40px',padding:'7px 16px',boxShadow:'0 3px 16px rgba(0,0,0,0.13)',display:'flex',gap:'10px',alignItems:'center',border:'1px solid #E9EEF3'}}>
              {PALETTE.map(opt => {
                const active = selectedPaint === opt.id;
                return (
                  <button key={opt.id} title={opt.label}
                    onClick={() => setSelectedPaint(p => p===opt.id ? null : opt.id)}
                    style={{width:'26px',height:'26px',borderRadius:'50%',background:opt.color??'#F3F4F6',border:active?'3px solid #1E88E5':`1.5px solid ${opt.color?opt.color+'AA':'#9CA3AF'}`,cursor:'pointer',padding:0,display:'flex',alignItems:'center',justifyContent:'center',transform:active?'scale(1.25)':'scale(1)',transition:'transform .15s, border .15s, box-shadow .15s',boxSizing:'border-box',boxShadow:active?'0 0 0 2px white, 0 0 0 4px #1E88E5':'0 1px 3px rgba(0,0,0,0.15)'}}>
                    {opt.id==='sano' && (<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3.5" fill="none" stroke="#9CA3AF" strokeWidth="1.3"/></svg>)}
                    {opt.id==='extraido' && (<svg width="12" height="12" viewBox="0 0 12 12"><line x1="3" y1="3" x2="9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="3" x2="3" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>)}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPaint && (
            <p className="dentista-texto-xpequeno" style={{textAlign:'center',color:'#6B7280',margin:'5px 0 0',fontStyle:'italic'}}>
              Aplicando{' '}
              <strong style={{color:PALETTE.find(p=>p.id===selectedPaint)?.color??'#374151',fontStyle:'normal'}}>
                {PALETTE.find(p=>p.id===selectedPaint)?.label}
              </strong>
              {' '}— haz clic en un diente
            </p>
          )}

          {/* ── NUEVO: Botón Guardar + feedback ── */}
          {onGuardar && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginTop:12}}>
              <button
                onClick={handleGuardar}
                disabled={saving || !hasChanges}
                style={{
                  padding:'8px 22px', borderRadius:10, border:'none',
                  background: hasChanges
                    ? 'linear-gradient(135deg,#4f46e5,#db2777)'
                    : '#e5e7eb',
                  color: hasChanges ? 'white' : '#9ca3af',
                  fontWeight:700, cursor: hasChanges ? 'pointer' : 'default',
                  transition:'all 0.2s', boxShadow: hasChanges ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                }}
              >
                {saving ? 'Guardando...' : 'Guardar odontograma'}
              </button>
              {savedMsg && (
                <span className="dentista-texto-xpequeno" style={{fontWeight:600,color: savedMsg.startsWith('Error') ? '#dc2626' : '#16a34a'}}>
                  {savedMsg.startsWith('Error') ? '✗' : '✓'} {savedMsg}
                </span>
              )}
            </div>
          )}

          {/* Leyenda */}
          <div style={{display:'flex',justifyContent:'center',flexWrap:'wrap',gap:'5px 12px',marginTop:'10px',padding:'8px 0 2px',borderTop:'1px solid #EEF2F7'}}>
            {PALETTE.filter(p=>p.id!=='sano').map(opt=>(
              <div key={opt.id} className="dentista-texto-xpequeno" style={{display:'flex',alignItems:'center',gap:'4px',color:'#4B5563'}}>
                <span style={{width:'9px',height:'9px',borderRadius:'2px',background:opt.color??'#4B5563',display:'inline-block',flexShrink:0,boxShadow:'0 1px 2px rgba(0,0,0,0.15)'}}/>
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Odontograma;