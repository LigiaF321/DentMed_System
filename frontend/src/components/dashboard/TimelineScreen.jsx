import React from "react";
import "./TimelineScreen.css";

export default function TimelineScreen({ usuario = "jperez", nombre = "Dr. Juan Pérez", onBack }) {
  // Datos simulados para el gráfico y eventos
  const periodo = { desde: "01/02/2026", hasta: "29/02/2026" };
  const agrupaciones = ["Hora", "Día", "Semana", "Mes"];
  const tipos = ["Todas", "Solo sesiones", "Solo citas", "Solo configuraciones"];
  const resumen = {
    total: 42,
    diaMax: "15/02/2026",
    horaMax: "10:00",
    accionFrecuente: "Crear cita"
  };
  const eventos = [
    { fecha: "21/02/2026 10:35:22", accion: "Crear cita", modulo: "Citas", detalle: "Paciente: María González", ip: "10.0.0.12" },
    { fecha: "20/02/2026 09:15:10", accion: "Editar cita", modulo: "Citas", detalle: "Paciente: Juan Pérez", ip: "10.0.0.12" },
    { fecha: "18/02/2026 14:22:05", accion: "Inicio sesión", modulo: "Login", detalle: "Éxito", ip: "10.0.0.12" },
    { fecha: "15/02/2026 11:45:30", accion: "Configurar", modulo: "Horarios", detalle: "Cambio horario sábado", ip: "10.0.0.12" },
  ];

  return (
    <div className="dm2-page">
      <div className="dm2-card">
        <div className="dm2-card-head">
          <div className="timeline-header">
            <div className="timeline-title">Línea de tiempo de actividad - {nombre} ({usuario})</div>
            <button className="timeline-back-btn" onClick={onBack}>VOLVER A TABLA</button>
          </div>
          <div className="timeline-period">
            <label>Desde: <input type="date" defaultValue="2026-02-01" /></label>
            <label>Hasta: <input type="date" defaultValue="2026-02-29" /></label>
            <button>HOY</button>
            <button>ÚLTIMOS 7 DÍAS</button>
            <button>ESTE MES</button>
          </div>
          <div className="timeline-options">
            <label>Agrupar por:
              <select>{agrupaciones.map((g) => <option key={g}>{g}</option>)}</select>
            </label>
            <label>Tipo de actividad:
              <select>{tipos.map((t) => <option key={t}>{t}</option>)}</select>
            </label>
          </div>
        </div>
        <div className="dm2-card-body">
          {/* Gráfico simulado */}
          <div className="timeline-chart">
            <svg width="100%" height="120" viewBox="0 0 400 120">
              <polyline points="10,100 60,80 110,60 160,90 210,40 260,70 310,50 360,100" fill="none" stroke="#1a5f3f" strokeWidth="3" />
              {/* Eje X */}
              <line x1="10" y1="110" x2="390" y2="110" stroke="#888" strokeWidth="2" />
              {/* Eje Y */}
              <line x1="10" y1="20" x2="10" y2="110" stroke="#888" strokeWidth="2" />
            </svg>
            <div className="timeline-chart-labels">
              <span>01/02</span><span>07/02</span><span>14/02</span><span>21/02</span><span>28/02</span>
            </div>
          </div>
          {/* Resumen estadístico */}
          <div className="timeline-summary">
            <div>Total de acciones: <strong>{resumen.total}</strong></div>
            <div>Día con mayor actividad: <strong>{resumen.diaMax}</strong></div>
            <div>Hora más activa: <strong>{resumen.horaMax}</strong></div>
            <div>Acción más frecuente: <strong>{resumen.accionFrecuente}</strong></div>
          </div>
          {/* Lista de eventos */}
          <div className="timeline-events-list">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Acción</th>
                  <th>Módulo</th>
                  <th>Detalle</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev, idx) => (
                  <tr key={idx}>
                    <td>{ev.fecha}</td>
                    <td>{ev.accion}</td>
                    <td>{ev.modulo}</td>
                    <td>{ev.detalle}</td>
                    <td>{ev.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="timeline-pagination">Mostrando 1-4 de 42 eventos (página 1 de 11)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
