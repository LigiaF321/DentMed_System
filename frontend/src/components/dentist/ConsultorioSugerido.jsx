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
        <ul style={{ listStyle: "none", padding: 0 }}>
          {consultorios.map((c) => {

            const noDisponible =
              c.estado === "ocupado" ||
              c.estado === "mantenimiento" ||
              c.disponible === false;

            const isSelected = selectedConsultorio?.id === c.id;

            return (
              <li key={c.id} style={{ marginBottom: "10px" }}>
                <button
                  onClick={() => !noDisponible && onSelectConsultorio(c)}
                  disabled={noDisponible}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    cursor: noDisponible ? "not-allowed" : "pointer",
                    background: isSelected
                      ? "#d1e7dd"
                      : noDisponible
                      ? "#f8d7da"
                      : "#fff",
                    border: isSelected
                      ? "2px solid #0f5132"
                      : "1px solid #ccc",
                    textAlign: "left",
                    opacity: noDisponible ? 0.6 : 1
                  }}
                >
                  <strong>{c.nombre}</strong>

                  {" - "} Equipamiento:{" "}
                  {Array.isArray(c.equipamiento)
                    ? c.equipamiento.join(", ")
                    : c.equipamiento || "No especificado"}

                  {" - "} Estado:{" "}
                  {c.estado || (c.disponible ? "Disponible" : "Ocupado")}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No hay consultorios disponibles.</p>
      )}
    </div>
  );
};

export default ConsultorioSugerido;