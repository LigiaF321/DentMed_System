// frontend/src/components/dentist/Odontograma.jsx
import React, { useState } from 'react';

// ─── Paleta ───────────────────────────────────────────────────────────────────
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

// Upper vs lower, plus type
const getToothInfo = (n) => {
  const upper = n >= 11 && n <= 28;
  let type;
  if ([18,17,16,26,27,28,38,37,36,46,47,48].includes(n)) type = 'molar';
  else if ([15,14,24,25,34,35,44,45].includes(n))        type = 'premolar';
  else if ([13,23,33,43].includes(n))                    type = 'canine';
  else                                                   type = 'incisor';
  return { upper, type };
};

// ─────────────────────────────────────────────────────────────────────────────
//  DEFINICIONES ANATÓMICAS
//
//  Convención de coordenadas (vista bucal):
//    y = 0  →  borde incisal / punta cuspídea  (ARRIBA del SVG)
//    y = ~38 → unión cemento-esmalte (CEJ / cuello del diente)
//    y = max →  ápice radicular  (ABAJO del SVG)
//
//  Dientes SUPERIORES: flip CSS scaleY(-1)
//    → corona queda abajo (alineada al margen gingival)
//    → raíces apuntan arriba
//
//  Dientes INFERIORES: sin flip
//    → corona arriba, raíces abajo
//
//  crownPath  : corona (un solo path)
//  rootPaths  : array de raíces (cada una es un path independiente)
//  overlayPath: zona coloreada al aplicar condición
//  xv         : [cx, cy, r] para la marca ✕ en extraídos
// ─────────────────────────────────────────────────────────────────────────────

const DEFS = {

  // ════════════════════════════════════════════════════════ INCISIVO SUPERIOR
  // vBox 32×88  |  display 24×66
  // Corona: trapezoide ancho. Raíz: única, cónica
  upper_incisor: {
    dims: { W: 24, H: 66, vW: 32, vH: 88 },
    crownPath: 'M 5,0 L 27,0 Q 30,0 30,6 L 28,36 Q 16,42 4,36 L 2,6 Q 2,0 5,0 Z',
    rootPaths: [
      'M 4,36 Q 16,42 28,36 L 25,82 Q 16,88 7,82 Z',
    ],
    overlayPath: 'M 6,2 L 26,2 Q 28,2 28,6 L 26,29 Q 16,33 6,29 L 4,6 Q 4,2 6,2 Z',
    xv: [16, 18, 11],
  },

  // ════════════════════════════════════════════════════════ INCISIVO INFERIOR
  // vBox 26×84  |  display 20×64  (más estrecho que superior)
  lower_incisor: {
    dims: { W: 20, H: 64, vW: 26, vH: 84 },
    crownPath: 'M 3,0 L 23,0 Q 25,0 25,5 L 23,34 Q 13,38 3,34 L 1,5 Q 1,0 3,0 Z',
    rootPaths: [
      'M 3,34 Q 13,38 23,34 L 20,78 Q 13,84 6,78 Z',
    ],
    overlayPath: 'M 4,1 L 22,1 Q 23,1 23,5 L 21,27 Q 13,31 5,27 L 3,5 Q 3,1 4,1 Z',
    xv: [13, 16, 10],
  },

  // ════════════════════════════════════════════════════════ CANINO SUPERIOR
  // vBox 32×96  |  display 24×72
  // Corona: cusp prominente. Raíz: única, la más larga
  upper_canine: {
    dims: { W: 24, H: 72, vW: 32, vH: 96 },
    crownPath: 'M 16,0 Q 24,2 28,14 Q 30,24 29,36 Q 23,42 16,42 Q 9,42 3,36 Q 2,24 4,14 Q 8,2 16,0 Z',
    rootPaths: [
      'M 3,36 Q 16,42 29,36 L 26,90 Q 16,96 6,90 Z',
    ],
    overlayPath: 'M 16,3 Q 22,5 25,14 Q 27,23 26,34 Q 21,38 16,38 Q 11,38 6,34 Q 5,23 7,14 Q 10,5 16,3 Z',
    xv: [16, 18, 11],
  },

  // ════════════════════════════════════════════════════════ CANINO INFERIOR
  lower_canine: {
    dims: { W: 22, H: 70, vW: 30, vH: 92 },
    crownPath: 'M 15,0 Q 22,2 26,12 Q 28,22 27,36 Q 21,40 15,40 Q 9,40 3,36 Q 2,22 4,12 Q 8,2 15,0 Z',
    rootPaths: [
      'M 3,36 Q 15,40 27,36 L 24,86 Q 15,92 6,86 Z',
    ],
    overlayPath: 'M 15,3 Q 21,5 24,13 Q 26,22 25,34 Q 20,38 15,38 Q 10,38 5,34 Q 4,22 6,13 Q 9,5 15,3 Z',
    xv: [15, 18, 10],
  },

  // ════════════════════════════════════════════════════════ PREMOLAR SUPERIOR
  // vBox 38×88  |  display 29×66
  // Corona: 2 cúspides con valle. Raíces: 2 bifurcadas (bucal + palatal)
  upper_premolar: {
    dims: { W: 29, H: 66, vW: 38, vH: 88 },
    crownPath: `
      M 4,36 Q 3,24 4,8 Q 4,0 11,0
      Q 17,16 19,3
      Q 21,16 27,0
      Q 34,0 34,8 Q 35,24 34,36
      Q 19,42 4,36 Z
    `,
    rootPaths: [
      // Raíz bucal (izquierda)
      'M 4,36 Q 10,42 16,42 L 13,80 Q 8,86 2,82 Z',
      // Raíz palatina (derecha), espacio visible entre ambas
      'M 22,42 Q 28,42 34,36 L 34,42 L 33,80 Q 27,86 22,82 Z',
    ],
    overlayPath: 'M 8,3 Q 8,0 12,0 Q 18,11 19,3 Q 20,11 26,1 Q 30,1 30,4 L 30,18 Q 19,22 8,18 Z',
    xv: [19, 17, 11],
  },

  // ════════════════════════════════════════════════════════ PREMOLAR INFERIOR
  // vBox 32×82  |  display 24×62
  // Corona: 1 cúspide bucal dominante. Raíz: única
  lower_premolar: {
    dims: { W: 24, H: 62, vW: 32, vH: 82 },
    crownPath: `
      M 3,32 Q 2,22 3,6 Q 3,0 13,0
      Q 17,14 18,2 Q 22,12 25,2
      Q 29,0 29,6 Q 30,22 29,32
      Q 16,38 3,32 Z
    `,
    rootPaths: [
      'M 3,32 Q 16,38 29,32 L 27,76 Q 16,82 5,76 Z',
    ],
    overlayPath: 'M 6,2 Q 6,0 13,0 Q 17,10 18,2 Q 22,8 24,2 Q 26,0 26,4 L 26,16 Q 16,20 6,16 Z',
    xv: [16, 15, 10],
  },

  // ════════════════════════════════════════════════════════ MOLAR SUPERIOR
  // vBox 56×88  |  display 42×66
  // Corona: muy ancha, 3–4 cúspides. Raíces: 3 (mesio-bucal, disto-bucal, palatina)
  upper_molar: {
    dims: { W: 42, H: 66, vW: 56, vH: 88 },
    crownPath: `
      M 3,36 Q 2,26 3,8 Q 3,0 13,0
      Q 19,18 28,3
      Q 37,18 43,3
      Q 53,0 53,8 Q 54,26 53,36
      Q 28,46 3,36 Z
    `,
    rootPaths: [
      // Raíz mesio-bucal (izquierda)
      'M 3,36 Q 9,44 17,44 L 14,80 Q 8,86 1,82 Z',
      // Raíz disto-bucal (centro) — separada ~5px de la mesio-bucal
      'M 22,44 Q 28,42 35,44 L 33,80 Q 27,86 20,82 Z',
      // Raíz palatina (derecha) — más ancha, separada ~5px de la disto-bucal
      'M 41,44 Q 48,42 53,36 L 54,44 L 53,80 Q 46,86 40,82 Z',
    ],
    overlayPath: 'M 9,3 Q 9,0 14,0 Q 20,14 28,3 Q 36,14 42,3 Q 48,0 48,4 L 48,20 Q 28,26 9,20 Z',
    xv: [28, 17, 13],
  },

  // ════════════════════════════════════════════════════════ MOLAR INFERIOR
  // vBox 50×84  |  display 38×64
  // Corona: muy ancha, 4–5 cúspides. Raíces: 2 (mesial más ancha, distal)
  lower_molar: {
    dims: { W: 38, H: 64, vW: 50, vH: 84 },
    crownPath: `
      M 2,34 Q 1,24 2,8 Q 2,0 11,0
      Q 17,16 25,2
      Q 33,16 39,2
      Q 48,0 48,8 Q 49,24 48,34
      Q 25,44 2,34 Z
    `,
    rootPaths: [
      // Raíz mesial (izquierda) — más ancha, ligeramente curvada
      'M 2,34 Q 8,44 20,44 L 18,78 Q 11,84 2,80 Z',
      // Raíz distal (derecha) — más estrecha, separada ~6px
      'M 26,44 Q 38,42 48,34 L 49,44 L 47,78 Q 39,84 30,80 Z',
    ],
    overlayPath: 'M 7,3 Q 7,0 12,0 Q 18,12 25,2 Q 32,12 38,3 Q 44,0 44,4 L 44,18 Q 25,23 7,18 Z',
    xv: [25, 16, 13],
  },
};

// ─── Selector de definición ───────────────────────────────────────────────────
const getDef = (numero) => {
  const { upper, type } = getToothInfo(numero);
  const key = `${upper ? 'upper' : 'lower'}_${type}`;
  return DEFS[key];
};

// ─── Componente Diente ────────────────────────────────────────────────────────
const Tooth = ({ numero, isUpper, condition, onToothClick }) => {
  const [hovered, setHovered] = useState(false);

  const def         = getDef(numero);
  const isExtracted = condition === 'extraido';
  const paletteItem = PALETTE.find(p => p.id === condition);
  const overlayColor = !isExtracted ? (paletteItem?.color ?? null) : null;
  const [xcx, xcy, xcr] = def.xv;

  const gid = `g${numero}`;
  // Centro del gradiente en la zona media de la corona
  const gcx = def.dims.vW * 0.42;
  const gcy = def.dims.vH * 0.18;
  const gcr = def.dims.vW * 0.68;

  const numColor = (condition && condition !== 'sano' && paletteItem?.color)
    ? paletteItem.color : '#9CA3AF';

  const svgInner = (
    <>
      <defs>
        <radialGradient id={gid} cx={gcx} cy={gcy} r={gcr}
          fx={gcx} fy={gcy} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#8FBDD4" />
          <stop offset="50%"  stopColor="#4E6677" />
          <stop offset="100%" stopColor="#243340" />
        </radialGradient>
      </defs>

      {/* Raíces primero (quedan detrás de la corona) */}
      <g fill={`url(#${gid})`} stroke="#182530" strokeWidth="1.3"
        strokeLinejoin="round" strokeLinecap="round">
        {def.rootPaths.map((p, i) => <path key={i} d={p} />)}
      </g>

      {/* Corona encima */}
      <path d={def.crownPath}
        fill={`url(#${gid})`} stroke="#182530"
        strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />

      {/* Overlay de condición */}
      {overlayColor && (
        <path d={def.overlayPath}
          fill={overlayColor} stroke="none" opacity="0.90" />
      )}

      {/* Marca ✕ extracción */}
      {isExtracted && (
        <g stroke="#B0BEC5" strokeWidth="2.6" strokeLinecap="round">
          <line x1={xcx - xcr * 0.7} y1={xcy - xcr * 0.7}
                x2={xcx + xcr * 0.7} y2={xcy + xcr * 0.7} />
          <line x1={xcx + xcr * 0.7} y1={xcy - xcr * 0.7}
                x2={xcx - xcr * 0.7} y2={xcy + xcr * 0.7} />
        </g>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}
      title={`Diente ${numero} — ${paletteItem?.label ?? 'Sano'}`}>

      {isUpper && (
        <svg width={def.dims.W} height={def.dims.H}
          viewBox={`0 0 ${def.dims.vW} ${def.dims.vH}`}
          style={{
            display: 'block', cursor: 'pointer',
            transform: 'scaleY(-1)',
            filter: hovered ? 'brightness(1.2)' : 'none',
            transition: 'filter 0.12s',
          }}
          onClick={() => onToothClick(numero)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}>
          {svgInner}
        </svg>
      )}

      <span style={{
        fontSize: '9px', fontWeight: '700', color: numColor,
        display: 'block', textAlign: 'center', lineHeight: 1,
        width: def.dims.W,
        marginTop:    isUpper  ? '2px' : 0,
        marginBottom: !isUpper ? '2px' : 0,
      }}>
        {numero}
      </span>

      {!isUpper && (
        <svg width={def.dims.W} height={def.dims.H}
          viewBox={`0 0 ${def.dims.vW} ${def.dims.vH}`}
          style={{
            display: 'block', cursor: 'pointer',
            filter: hovered ? 'brightness(1.2)' : 'none',
            transition: 'filter 0.12s',
          }}
          onClick={() => onToothClick(numero)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}>
          {svgInner}
        </svg>
      )}
    </div>
  );
};

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display:'flex', alignItems:'center', gap:'5px',
    cursor:'pointer', fontSize:'10px', color:'#6B7280', userSelect:'none' }}>
    <div onClick={onChange} style={{
      width:'32px', height:'18px', borderRadius:'9px',
      background: checked ? '#6366F1' : '#D1D5DB',
      position:'relative', transition:'background .2s', flexShrink:0,
    }}>
      <div style={{
        width:'14px', height:'14px', borderRadius:'50%', background:'white',
        position:'absolute', top:'2px', left: checked ? '16px' : '2px',
        transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.25)',
      }}/>
    </div>
    {label}
  </label>
);

// ─── Odontograma ─────────────────────────────────────────────────────────────
const Odontograma = ({ paciente }) => {
  const [teethStates,   setTeethStates]   = useState(INITIAL_TEETH);
  const [selectedPaint, setSelectedPaint] = useState(null);
  const [isPediatric,   setIsPediatric]   = useState(false);

  const handleToothClick = (n) => {
    if (!selectedPaint) return;
    setTeethStates(prev => ({ ...prev, [String(n)]: selectedPaint }));
  };

  const getCond = (n) => teethStates[String(n)] ?? 'sano';

  const upperLeft  = [18,17,16,15,14,13,12,11];
  const upperRight = [21,22,23,24,25,26,27,28];
  const lowerLeft  = [48,47,46,45,44,43,42,41];
  const lowerRight = [31,32,33,34,35,36,37,38];

  if (!paciente) {
    return (
      <div style={{ padding:'20px', textAlign:'center', color:'#9CA3AF',
        background:'#F9FAFB', borderRadius:'8px', border:'1px dashed #E5E7EB' }}>
        <p style={{ margin:0, fontSize:'12px' }}>
          Seleccione un paciente para ver su odontograma
        </p>
      </div>
    );
  }

  const ArchRow = ({ teeth, isUpper }) => (
    <div style={{
      display:'flex', justifyContent:'center',
      alignItems: isUpper ? 'flex-end' : 'flex-start',
      gap:'1px',
    }}>
      {teeth.slice(0,8).map(n => (
        <Tooth key={n} numero={n} isUpper={isUpper}
          condition={getCond(n)} onToothClick={handleToothClick} />
      ))}
      <div style={{ width:'2px', alignSelf:'stretch', background:'#94A3B8',
        opacity:0.4, margin:'0 2px', flexShrink:0 }} />
      {teeth.slice(8).map(n => (
        <Tooth key={n} numero={n} isUpper={isUpper}
          condition={getCond(n)} onToothClick={handleToothClick} />
      ))}
    </div>
  );

  return (
    <div style={{
      background:'white', borderRadius:'10px', padding:'12px 10px 10px',
      fontFamily:"'Segoe UI', system-ui, sans-serif",
      position:'relative', zIndex:0,
      maxWidth:'100%', boxSizing:'border-box',
    }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'8px', flexWrap:'wrap', gap:'4px' }}>
        <div>
          <span style={{ fontWeight:'700', fontSize:'13px', color:'#111827' }}>
            {paciente.paciente_nombre}
          </span>
          <span style={{ color:'#6B7280', fontSize:'11px', marginLeft:'5px' }}>
            (Age: {paciente.edad ?? '—'}, ID: {paciente.id ?? paciente.id_paciente ?? '—'})
          </span>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <Toggle checked={isPediatric} onChange={() => setIsPediatric(v=>!v)}
            label="Adult/Pediatric Toggle" />
          <button style={{ border:'none', background:'transparent', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center',
            gap:'1px', color:'#6B7280', padding:0, fontSize:'10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            History
          </button>
        </div>
      </div>

      {/* Grilla */}
      <div style={{ background:'#EEF2F7', borderRadius:'8px',
        padding:'8px 4px', border:'1px solid #D0D8E4', overflowX:'auto' }}>
        <div style={{ minWidth:'max-content' }}>
          <ArchRow teeth={[...upperLeft,...upperRight]} isUpper={true} />
          <div style={{ height:'1px', background:'#94A3B8', margin:'4px 8px', opacity:0.4 }} />
          <ArchRow teeth={[...lowerLeft,...lowerRight]} isUpper={false} />
        </div>
      </div>

      {/* Paleta */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:'10px' }}>
        <div style={{ background:'white', borderRadius:'30px', padding:'6px 14px',
          boxShadow:'0 2px 12px rgba(0,0,0,0.15)',
          display:'flex', gap:'8px', alignItems:'center' }}>
          {PALETTE.map(opt => {
            const active = selectedPaint === opt.id;
            return (
              <button key={opt.id} title={opt.label}
                onClick={() => setSelectedPaint(p => p===opt.id ? null : opt.id)}
                style={{
                  width:'28px', height:'28px', borderRadius:'50%',
                  background: opt.color ?? 'white',
                  border: active
                    ? '3px solid #6366F1'
                    : `2px solid ${opt.color ? opt.color+'BB' : '#9CA3AF'}`,
                  cursor:'pointer', padding:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transform: active ? 'scale(1.2)' : 'scale(1)',
                  transition:'transform .15s, border .15s',
                  boxSizing:'border-box',
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
      <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap',
        gap:'5px 10px', marginTop:'8px' }}>
        {PALETTE.filter(p => p.id !== 'sano').map(opt => (
          <div key={opt.id} style={{ display:'flex', alignItems:'center',
            gap:'3px', fontSize:'9px', color:'#6B7280' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'2px',
              background: opt.color ?? '#4B5563',
              border:'1px solid rgba(0,0,0,0.12)', display:'inline-block' }} />
            {opt.label}
          </div>
        ))}
      </div>

    </div>
  );
};

export default Odontograma;