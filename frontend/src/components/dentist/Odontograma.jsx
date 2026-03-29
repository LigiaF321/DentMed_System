// frontend/src/components/dentist/Odontograma.jsx
import React from 'react';
import './Odontograma.css';

const Odontograma = ({ paciente }) => {
  // Datos de prueba de dientes con tratamientos
  const dientesData = {
    11: { estado: 'realizado', tratamiento: 'Obturación' },
    12: { estado: 'realizado', tratamiento: 'Obturación' },
    13: { estado: 'realizado', tratamiento: 'Obturación' },
    14: { estado: 'realizado', tratamiento: 'Endodoncia' },
    15: { estado: 'planificado', tratamiento: 'Caries' },
    16: { estado: 'planificado', tratamiento: 'Endodoncia' },
    17: { estado: 'planificado', tratamiento: 'Extracción' },
    18: { estado: 'realizado', tratamiento: 'Extracción' },
    21: { estado: 'realizado', tratamiento: 'Obturación' },
    22: { estado: 'realizado', tratamiento: 'Obturación' },
    23: { estado: 'realizado', tratamiento: 'Obturación' },
    24: { estado: 'realizado', tratamiento: 'Obturación' },
    25: { estado: 'planificado', tratamiento: 'Caries' },
    26: { estado: 'realizado', tratamiento: 'Endodoncia' },
    27: { estado: 'realizado', tratamiento: 'Endodoncia' },
    28: { estado: 'realizado', tratamiento: 'Extracción' },
    31: { estado: 'realizado', tratamiento: 'Obturación' },
    32: { estado: 'realizado', tratamiento: 'Obturación' },
    33: { estado: 'realizado', tratamiento: 'Obturación' },
    34: { estado: 'realizado', tratamiento: 'Obturación' },
    35: { estado: 'planificado', tratamiento: 'Caries' },
    36: { estado: 'realizado', tratamiento: 'Endodoncia' },
    37: { estado: 'realizado', tratamiento: 'Endodoncia' },
    38: { estado: 'planificado', tratamiento: 'Extracción' },
    41: { estado: 'realizado', tratamiento: 'Obturación' },
    42: { estado: 'realizado', tratamiento: 'Obturación' },
    43: { estado: 'realizado', tratamiento: 'Obturación' },
    44: { estado: 'realizado', tratamiento: 'Obturación' },
    45: { estado: 'planificado', tratamiento: 'Caries' },
    46: { estado: 'planificado', tratamiento: 'Conducto' },
    47: { estado: 'realizado', tratamiento: 'Endodoncia' },
    48: { estado: 'realizado', tratamiento: 'Extracción' },
  };

  // Números de dientes
  const superioresDerecha = [18, 17, 16, 15, 14, 13, 12, 11];
  const superioresIzquierda = [21, 22, 23, 24, 25, 26, 27, 28];
  const inferioresDerecha = [48, 47, 46, 45, 44, 43, 42, 41];
  const inferioresIzquierda = [31, 32, 33, 34, 35, 36, 37, 38];

  const getEstadoDiente = (numero) => {
    const diente = dientesData[numero];
    if (diente) return diente.estado;
    return 'normal';
  };

  const getTooltipTexto = (numero) => {
    const diente = dientesData[numero];
    if (diente) return `${diente.tratamiento} - Diente ${numero}`;
    return `Diente ${numero} - Sano`;
  };

  const renderDiente = (numero) => {
    const estado = getEstadoDiente(numero);
    let className = 'diente';
    if (estado === 'planificado') className += ' planificado';
    if (estado === 'realizado') className += ' realizado';
    
    return (
      <div key={numero} className={className} title={getTooltipTexto(numero)}>
        <span className="diente-numero">{numero}</span>
      </div>
    );
  };

  if (!paciente) {
    return (
      <div className="odontograma-empty">
        <i className="fas fa-tooth"></i>
        <p>Seleccione un paciente para ver su odontograma</p>
      </div>
    );
  }

  return (
    <div className="odontograma">
      <div className="odontograma-titulo">
        <i className="fas fa-tooth"></i> Odontograma
        <span className="odontograma-paciente">{paciente.paciente_nombre}</span>
      </div>
      
      {/* Arcada Superior */}
      <div className="arcada superior">
        <div className="arcada-label">Superior</div>
        <div className="dientes-linea">
          <div className="dientes-derecha">
            {superioresDerecha.map(num => renderDiente(num))}
          </div>
          <div className="dientes-izquierda">
            {superioresIzquierda.map(num => renderDiente(num))}
          </div>
        </div>
      </div>
      
      {/* Línea media */}
      <div className="linea-media"></div>
      
      {/* Arcada Inferior */}
      <div className="arcada inferior">
        <div className="arcada-label">Inferior</div>
        <div className="dientes-linea">
          <div className="dientes-derecha">
            {inferioresDerecha.map(num => renderDiente(num))}
          </div>
          <div className="dientes-izquierda">
            {inferioresIzquierda.map(num => renderDiente(num))}
          </div>
        </div>
      </div>
      
      {/* Leyenda */}
      <div className="odontograma-leyenda">
        <div className="leyenda-item">
          <span className="diente-normal"></span>
          <span>Sano</span>
        </div>
        <div className="leyenda-item">
          <span className="diente-planificado"></span>
          <span>Planificado</span>
        </div>
        <div className="leyenda-item">
          <span className="diente-realizado"></span>
          <span>Realizado</span>
        </div>
      </div>
    </div>
  );
};

export default Odontograma;