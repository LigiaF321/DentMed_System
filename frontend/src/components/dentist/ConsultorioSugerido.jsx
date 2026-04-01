import React from "react";

// Componente para mostrar y seleccionar consultorios sugeridos según el procedimiento
const ConsultorioSugerido = ({ procedimiento, onSelectConsultorio, consultorios, loading }) => {
  return (
    <div>
      <h4>Consultorios sugeridos para "{procedimiento}"</h4>
      {loading ? (
        <p>Cargando consultorios...</p>
      ) : consultorios && consultorios.length > 0 ? (
        <ul>
          {consultorios.map((c) => (
            <li key={c.id}>
              <button onClick={() => onSelectConsultorio(c)}>
                <strong>{c.nombre}</strong> - Equipamiento: {c.equipamiento.join(", ")} - {c.disponible ? "Disponible" : "Ocupado"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay consultorios sugeridos para este procedimiento.</p>
      )}
    </div>
  );
};

export default ConsultorioSugerido;
