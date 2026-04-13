// frontend/src/components/dentist/Odontograma.jsx
import React, { useState } from 'react';

const PALETTE = [
  { id: 'caries',      color: '#DC2626', label: 'Caries' },
  { id: 'planificado', color: '#D97706', label: 'Planificado' },
  { id: 'obturado',    color: '#059669', label: 'Obturado' },
  { id: 'tratamiento', color: '#2563EB', label: 'Tratamiento' },
  { id: 'extraido',    color: null,      label: 'Extraído' },
  { id: 'sano',        color: null,      label: 'Sano' },
];

const mapEstado = (e) => {
  if (!e || e === 'normal') return 'sano';
  if (e === 'realizado')    return 'obturado';
  if (e === 'planificado')  return 'planificado';
  if (e === 'extraido')     return 'extraido';
  return 'sano';
};

const dientesDataOriginal = {
  11:'realizado', 12:'realizado', 13:'realizado', 14:'realizado',
  15:'planificado', 16:'planificado', 17:'planificado', 18:'realizado',
  21:'realizado', 22:'realizado', 23:'realizado', 24:'realizado',
  25:'planificado', 26:'realizado', 27:'realizado', 28:'realizado',
  31:'realizado', 32:'realizado', 33:'realizado', 34:'realizado',
  35:'planificado', 36:'realizado', 37:'realizado', 38:'planificado',
  41:'realizado', 42:'realizado', 43:'realizado', 44:'realizado',
  45:'planificado', 46:'planificado', 47:'realizado', 48:'realizado',
};

const INITIAL_TEETH = Object.fromEntries(
  Object.entries(dientesDataOriginal).map(([n, e]) => [n, mapEstado(e)])
);

const getToothType = (n) => {
  const upper = (n >= 11 && n <= 28);
  if ([18,17,16,26,27,28,38,37,36,46,47,48].includes(n)) return upper ? 'upper_molar'    : 'lower_molar';
  if ([15,14,24,25,34,35,44,45].includes(n))             return upper ? 'upper_premolar' : 'lower_premolar';
  if ([13,23,33,43].includes(n))                         return upper ? 'upper_canine'   : 'lower_canine';
  if ([12,22,32,42].includes(n))                         return upper ? 'upper_lateral'  : 'lower_lateral';
  return upper ? 'upper_central' : 'lower_central';
};

const DEFS = {
  upper_central: {
    dims: { W: 26, H: 68, vW: 34, vH: 90 },
    crownPath: `M 7,0 L 27,0 Q 30,1 30,7 L 28,36 Q 17,43 6,36 L 4,7 Q 4,1 7,0 Z`,
    rootPaths: [`M 6,36 Q 17,43 28,36 L 24,82 Q 17,88 10,82 Z`],
    overlayPath: `M 8,1 L 26,1 Q 28,2 28,7 L 26,30 Q 17,36 8,30 L 6,7 Q 6,2 8,1 Z`,
    xv: [17, 18, 12],
  },
  upper_lateral: {
    dims: { W: 22, H: 66, vW: 28, vH: 88 },
    crownPath: `M 5,0 L 23,0 Q 26,1 26,7 Q 26,20 24,34 Q 14,41 4,34 Q 2,20 2,7 Q 2,1 5,0 Z`,
    rootPaths: [`M 4,34 Q 14,41 24,34 L 20,80 Q 14,86 8,80 Z`],
    overlayPath: `M 6,1 L 22,1 Q 24,2 24,7 Q 24,18 22,29 Q 14,34 6,29 Q 4,18 4,7 Q 4,2 6,1 Z`,
    xv: [14, 17, 10],
  },
  upper_canine: {
    dims: { W: 24, H: 74, vW: 30, vH: 98 },
    crownPath: `M 15,0 Q 22,3 26,14 Q 28,24 27,36 Q 21,42 15,42 Q 9,42 3,36 Q 2,24 4,14 Q 8,3 15,0 Z`,
    rootPaths: [`M 3,36 Q 9,42 15,42 Q 21,42 27,36 L 24,90 Q 15,97 6,90 Z`],
    overlayPath: `M 15,3 Q 21,6 24,15 Q 26,24 25,34 Q 20,39 15,39 Q 10,39 5,34 Q 4,24 6,15 Q 9,6 15,3 Z`,
    xv: [15, 20, 11],
  },
  upper_premolar: {
    dims: { W: 30, H: 68, vW: 40, vH: 90 },
    crownPath: `M 4,36 Q 2,26 3,8 Q 3,0 11,0 Q 18,16 20,2 Q 22,16 29,0 Q 37,0 37,8 Q 38,26 36,36 Q 20,44 4,36 Z`,
    rootPaths: [
      `M 4,36 Q 10,44 17,44 L 14,82 Q 8,88 2,84 Z`,
      `M 23,44 Q 30,44 36,36 L 37,44 L 36,82 Q 30,88 24,84 Z`,
    ],
    overlayPath: `M 8,2 Q 8,0 13,0 Q 19,11 20,2 Q 21,11 27,0 Q 33,0 33,4 L 33,19 Q 20,24 8,19 Z`,
    xv: [20, 17, 12],
  },
  upper_molar: {
    dims: { W: 42, H: 68, vW: 56, vH: 90 },
    crownPath: `M 3,36 Q 2,26 3,8 Q 3,0 13,0 Q 20,18 28,2 Q 36,18 43,2 Q 53,0 53,8 Q 54,26 53,36 Q 28,46 3,36 Z`,
    rootPaths: [
      `M 3,36 Q 8,44 16,45 L 13,80 Q 7,86 1,82 Z`,
      `M 20,45 Q 27,43 34,45 L 32,78 Q 26,84 19,80 Z`,
      `M 39,45 Q 47,43 53,36 L 54,45 L 52,82 Q 44,88 38,82 Z`,
    ],
    overlayPath: `M 9,2 Q 9,0 15,0 Q 22,14 28,2 Q 34,14 41,2 Q 48,0 48,4 L 48,20 Q 28,26 9,20 Z`,
    xv: [28, 17, 14],
  },
  lower_central: {
    dims: { W: 20, H: 64, vW: 24, vH: 84 },
    crownPath: `M 3,0 L 21,0 Q 23,1 23,6 L 21,32 Q 12,37 3,32 L 1,6 Q 1,1 3,0 Z`,
    rootPaths: [`M 3,32 Q 12,37 21,32 L 18,76 Q 12,82 6,76 Z`],
    overlayPath: `M 4,1 L 20,1 Q 21,2 21,6 L 19,26 Q 12,30 5,26 L 3,6 Q 3,2 4,1 Z`,
    xv: [12, 15, 9],
  },
  lower_lateral: {
    dims: { W: 21, H: 65, vW: 26, vH: 86 },
    crownPath: `M 3,0 L 23,0 Q 25,1 25,6 L 23,33 Q 13,38 3,33 L 1,6 Q 1,1 3,0 Z`,
    rootPaths: [`M 3,33 Q 13,38 23,33 L 19,78 Q 13,84 7,78 Z`],
    overlayPath: `M 4,1 L 22,1 Q 23,2 23,6 L 21,27 Q 13,31 5,27 L 3,6 Q 3,2 4,1 Z`,
    xv: [13, 16, 10],
  },
  lower_canine: {
    dims: { W: 22, H: 72, vW: 28, vH: 94 },
    crownPath: `M 14,0 Q 20,2 24,12 Q 26,22 25,34 Q 19,40 14,40 Q 9,40 3,34 Q 2,22 4,12 Q 8,2 14,0 Z`,
    rootPaths: [`M 3,34 Q 9,40 14,40 Q 19,40 25,34 L 22,86 Q 14,93 6,86 Z`],
    overlayPath: `M 14,3 Q 19,5 22,13 Q 24,22 23,32 Q 18,37 14,37 Q 10,37 6,32 Q 5,22 7,13 Q 10,5 14,3 Z`,
    xv: [14, 19, 10],
  },
  lower_premolar: {
    dims: { W: 26, H: 65, vW: 34, vH: 86 },
    crownPath: `M 3,32 Q 2,22 3,6 Q 3,0 12,0 Q 18,14 20,2 Q 25,12 28,2 Q 31,0 31,6 Q 32,22 31,32 Q 17,40 3,32 Z`,
    rootPaths: [`M 3,32 Q 17,40 31,32 L 28,78 Q 17,84 6,78 Z`],
    overlayPath: `M 6,2 Q 6,0 13,0 Q 18,10 20,2 Q 25,9 27,2 Q 28,0 28,4 L 28,17 Q 17,22 6,17 Z`,
    xv: [17, 16, 11],
  },
  lower_molar: {
    dims: { W: 40, H: 66, vW: 52, vH: 86 },
    crownPath: `M 2,32 Q 1,22 2,6 Q 2,0 11,0 Q 18,14 26,1 Q 34,14 40,1 Q 49,0 50,6 Q 51,22 50,32 Q 26,42 2,32 Z`,
    rootPaths: [
      `M 2,32 Q 7,42 19,43 L 16,78 Q 9,84 1,80 Z`,
      `M 25,43 Q 38,42 50,32 L 51,43 L 49,78 Q 40,84 30,80 Z`,
    ],
    overlayPath: `M 7,2 Q 7,0 13,0 Q 20,10 26,1 Q 32,10 38,1 Q 45,0 46,4 L 46,17 Q 26,22 7,17 Z`,
    xv: [26, 15, 14],
  },
};

const GRAD_LIGHT = '#9BBFD4';
const GRAD_MID   = '#5C7D8F';
const GRAD_DARK  = '#2E4A58';
const STROKE     = '#1A3040';

const Tooth = ({ numero, isUpper, condition, onToothClick }) => {
  const [hovered, setHovered] = useState(false);

  const type        = getToothType(numero);
  const def         = DEFS[type];
  const isExtracted = condition === 'extraido';
  const paletteItem = PALETTE.find(p => p.id === condition);
  const overlayColor = !isExtracted ? (paletteItem?.color ?? null) : null;
  const gid = `g${numero}`;
  const gcx = def.dims.vW * 0.4;
  const gcy = def.dims.vH * 0.15;
  const gcr = def.dims.vW * 0.72;
  const [xcx, xcy, xcr] = def.xv;
  const numColor = (condition && condition !== 'sano' && paletteItem?.color) ? paletteItem.color : '#6B7280';

  const svgContent = (
    <>
      <defs>
        <radialGradient id={gid} cx={gcx} cy={gcy} r={gcr} fx={gcx} fy={gcy} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={GRAD_LIGHT} />
          <stop offset="50%"  stopColor={GRAD_MID} />
          <stop offset="100%" stopColor={GRAD_DARK} />
        </radialGradient>
      </defs>
      <g fill={`url(#${gid})`} stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        {def.rootPaths.map((p, i) => <path key={i} d={p} />)}
      </g>
      <path d={def.crownPath} fill={`url(#${gid})`} stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      {overlayColor && (
        <path d={def.overlayPath} fill={overlayColor} stroke="none" opacity="0.88" />
      )}
      {isExtracted && (
        <g stroke="#9CA3AF" strokeWidth="2.8" strokeLinecap="round">
          <line x1={xcx - xcr * 0.72} y1={xcy - xcr * 0.72} x2={xcx + xcr * 0.72} y2={xcy + xcr * 0.72} />
          <line x1={xcx + xcr * 0.72} y1={xcy - xcr * 0.72} x2={xcx - xcr * 0.72} y2={xcy + xcr * 0.72} />
        </g>
      )}
    </>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}
      title={`Diente ${numero} — ${paletteItem?.label ?? 'Sano'}`}>
      {isUpper && (
        <svg width={def.dims.W} height={def.dims.H} viewBox={`0 0 ${def.dims.vW} ${def.dims.vH}`}
          style={{ display:'block', cursor:'pointer', transform:'scaleY(-1)',
            filter: hovered ? 'brightness(1.2)' : 'none', transition:'filter 0.12s' }}
          onClick={() => onToothClick(numero)}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          {svgContent}
        </svg>
      )}
      <span style={{ fontSize:'9px', fontWeight:'700', color:numColor,
        display:'block', textAlign:'center', lineHeight:1, width:def.dims.W,
        marginTop: isUpper ? '2px' : 0, marginBottom: !isUpper ? '2px' : 0 }}>
        {numero}
      </span>
      {!isUpper && (
        <svg width={def.dims.W} height={def.dims.H} viewBox={`0 0 ${def.dims.vW} ${def.dims.vH}`}
          style={{ display:'block', cursor:'pointer',
            filter: hovered ? 'brightness(1.2)' : 'none', transition:'filter 0.12s' }}
          onClick={() => onToothClick(numero)}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          {svgContent}
        </svg>
      )}
    </div>
  );
};

const Odontograma = ({ paciente }) => {
  const [teethStates,   setTeethStates]   = useState(INITIAL_TEETH);
  const [selectedPaint, setSelectedPaint] = useState(null);

  const handleToothClick = (n) => {
    if (!selectedPaint) return;
    setTeethStates(prev => ({ ...prev, [String(n)]: selectedPaint }));
  };

  const getCond = (n) => teethStates[String(n)] ?? 'sano';

  const upperLeft  = [18,17,16,15,14,13,12,11];
  const upperRight = [21,22,23,24,25,26,27,28];
  const lowerLeft  = [48,47,46,45,44,43,42,41];
  const lowerRight = [31,32,33,34,35,36,37,38];

  if (!paciente) return (
    <div style={{ padding:'20px', textAlign:'center', color:'#9CA3AF',
      background:'#F9FAFB', borderRadius:'8px', border:'1px dashed #E5E7EB' }}>
      <p style={{ margin:0, fontSize:'12px' }}>Seleccione un paciente para ver su odontograma</p>
    </div>
  );

  const ArchRow = ({ teeth, isUpper }) => (
    <div style={{ display:'flex', justifyContent:'center',
      alignItems: isUpper ? 'flex-end' : 'flex-start', gap:'1px' }}>
      {teeth.slice(0,8).map(n =>
        <Tooth key={n} numero={n} isUpper={isUpper} condition={getCond(n)} onToothClick={handleToothClick}/>
      )}
      <div style={{ width:'2px', alignSelf:'stretch', background:'#94A3B8',
        opacity:0.4, margin:'0 2px', flexShrink:0 }}/>
      {teeth.slice(8).map(n =>
        <Tooth key={n} numero={n} isUpper={isUpper} condition={getCond(n)} onToothClick={handleToothClick}/>
      )}
    </div>
  );

  return (
    <div style={{ background:'white', borderRadius:'10px', padding:'12px 10px 10px',
      fontFamily:"'Segoe UI', system-ui, sans-serif",
      position:'relative', zIndex:0, maxWidth:'100%', boxSizing:'border-box' }}>

      {/* Solo nombre del paciente */}
      <div style={{ marginBottom:'8px' }}>
        <span style={{ fontWeight:'700', fontSize:'13px', color:'#111827' }}>
          {paciente.paciente_nombre}
        </span>
      </div>

      {/* Grilla */}
      <div style={{ background:'#EEF2F7', borderRadius:'8px',
        padding:'8px 4px', border:'1px solid #D0D8E4', overflowX:'auto' }}>
        <div style={{ minWidth:'max-content' }}>
          <ArchRow teeth={[...upperLeft,...upperRight]} isUpper={true}/>
          <div style={{ height:'1px', background:'#94A3B8', margin:'4px 8px', opacity:0.4 }}/>
          <ArchRow teeth={[...lowerLeft,...lowerRight]} isUpper={false}/>
        </div>
      </div>

      {/* Paleta */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:'10px' }}>
        <div style={{ background:'white', borderRadius:'30px', padding:'6px 14px',
          boxShadow:'0 2px 12px rgba(0,0,0,0.15)', display:'flex', gap:'8px', alignItems:'center' }}>
          {PALETTE.map(opt => {
            const active = selectedPaint === opt.id;
            return (
              <button key={opt.id} title={opt.label}
                onClick={() => setSelectedPaint(p => p===opt.id ? null : opt.id)}
                style={{
                  width:'28px', height:'28px', borderRadius:'50%',
                  background: opt.color ?? 'white',
                  border: active ? '3px solid #6366F1' : `2px solid ${opt.color ? opt.color+'BB' : '#9CA3AF'}`,
                  cursor:'pointer', padding:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transform: active ? 'scale(1.2)' : 'scale(1)',
                  transition:'transform .15s, border .15s', boxSizing:'border-box',
                  boxShadow: active ? '0 0 0 2px white, 0 0 0 4px #6366F1' : 'none',
                }}>
                {opt.id === 'extraido' && (
                  <svg width="13" height="13" viewBox="0 0 13 13">
                    <circle cx="6.5" cy="6.5" r="5.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
                    <line x1="3.5" y1="3.5" x2="9.5" y2="9.5" stroke="#374151" strokeWidth="1.5"/>
                    <line x1="9.5" y1="3.5" x2="3.5" y2="9.5" stroke="#374151" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPaint && (
        <p style={{ textAlign:'center', fontSize:'10px', color:'#6B7280', margin:'4px 0 0' }}>
          Aplicando:{' '}
          <strong style={{ color: PALETTE.find(p=>p.id===selectedPaint)?.color ?? '#374151' }}>
            {PALETTE.find(p=>p.id===selectedPaint)?.label}
          </strong>
          {' '}— haz clic en un diente
        </p>
      )}

      {/* Leyenda */}
      <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'5px 10px', marginTop:'8px' }}>
        {PALETTE.filter(p => p.id !== 'sano').map(opt => (
          <div key={opt.id} style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'9px', color:'#6B7280' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'2px',
              background: opt.color ?? '#4B5563',
              border:'1px solid rgba(0,0,0,0.12)', display:'inline-block' }}/>
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Odontograma;