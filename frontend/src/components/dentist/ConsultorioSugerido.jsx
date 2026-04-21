import './styles/dentista-global.css';
import React from "react";

const ConsultorioSugerido = ({
  procedimiento,
  onSelectConsultorio,
  consultorios,
  loading,
  selectedConsultorio
}) => {
  return (
    <div>

      {/* Título */}
      <h4>Selecciona un consultorio disponible</h4>

      {loading ? (
        <p>Cargando consultorios...</p>
      ) : consultorios && consultorios.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {consultorios.map((c) => {
            const noDisponible =
              c.estado === "ocupado" ||
              c.estado === "mantenimiento" ||
              c.disponible === false;
            const isSelected = selectedConsultorio?.id === c.id;
            let estadoColor = '#22c55e';
            let estadoIcon = '🟢';
            let estadoLabel = 'Disponible';
            if (c.estado === 'ocupado' || c.disponible === false) {
              estadoColor = '#f87171';
              estadoIcon = '🔴';
              estadoLabel = 'Ocupado';
            } else if (c.estado === 'mantenimiento') {
              estadoColor = '#fbbf24';
              estadoIcon = '🟠';
              estadoLabel = 'Mantenimiento';
            }
            return (
              <button
                key={c.id}
                onClick={() => !noDisponible && onSelectConsultorio(c)}
                disabled={noDisponible}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  cursor: noDisponible ? 'not-allowed' : 'pointer',
                  background: isSelected
                    ? 'linear-gradient(90deg, #dbeafe 0%, #a7f3d0 100%)'
                    : '#fff',
                  border: isSelected
                    ? '2px solid #2563eb'
                    : '1px solid #e5e7eb',
                  boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.10)' : 'none',
                  opacity: noDisponible ? 0.6 : 1,
                  transition: 'all 0.2s',
                  marginBottom: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{c.nombre}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 600, color: estadoColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 18 }}>{estadoIcon}</span>
                    {estadoLabel}
                  </span>
                </div>
                <div style={{ marginTop: 6, fontSize: 14, color: '#334155' }}>
                  <b>Equipamiento:</b> {Array.isArray(c.equipamiento) ? c.equipamiento.join(', ') : c.equipamiento || 'No especificado'}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p>No hay consultorios disponibles.</p>
      )}
    </div>
  );
};

export default ConsultorioSugerido;