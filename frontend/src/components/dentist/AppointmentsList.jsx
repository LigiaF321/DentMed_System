import React, { useEffect, useState } from "react";
import CambiarConsultorioModal from "./CambiarConsultorioModal";
import { cancelarCita } from "../../services/citas.service";
import "./AppointmentsList.css";

const AppointmentsList = ({
  citas,
  onSelectCita,
  selectedCitaId,
  selectedDate,
  onCitaCancelada,
}) => {
  const [citaCambio, setCitaCambio] = useState(null);
  const [citasLocal, setCitasLocal] = useState(citas || []);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [citaPendienteCancelar, setCitaPendienteCancelar] = useState(null);

  useEffect(() => {
    setCitasLocal(Array.isArray(citas) ? citas : []);
  }, [citas]);

  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fechaBase = selectedDate ? new Date(selectedDate) : new Date();
  const esHoy = fechaBase.toDateString() === new Date().toDateString();

  const abrirDialogoCancelar = (e, cita) => {
    e.stopPropagation();

    const estado = String(cita.estado || "").toLowerCase();

    if (estado === "cancelada") {
      return;
    }

    setCitaPendienteCancelar(cita);
  };

  const cerrarDialogoCancelar = () => {
    if (cancelandoId) return;
    setCitaPendienteCancelar(null);
  };

  const confirmarCancelarCita = async () => {
    if (!citaPendienteCancelar) return;

    try {
      setCancelandoId(citaPendienteCancelar.id);

      const response = await cancelarCita(citaPendienteCancelar.id);

      setCitasLocal((prev) =>
        prev.filter(
          (item) => Number(item.id) !== Number(citaPendienteCancelar.id)
        )
      );

      if (onCitaCancelada) {
        onCitaCancelada(
          response?.data || {
            ...citaPendienteCancelar,
            estado: "cancelada",
            id_consultorio: null,
          }
        );
      }

      setCitaPendienteCancelar(null);
    } catch (error) {
      alert(error.message || "No se pudo cancelar la cita");
    } finally {
      setCancelandoId(null);
    }
  };

  return (
    <>
      <div className="appointments-list">
        <div className="appointments-header">
          <h3>{esHoy ? "Mi Agenda - Hoy" : "Mi Agenda"}</h3>
          <span className="appointments-date">
            {fechaBase.toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="appointments-items">
          {citasLocal.length === 0 ? (
            <div className="no-appointments">
              <i className="fas fa-calendar-day"></i>
              <p>No hay citas programadas para esta fecha</p>
            </div>
          ) : (
            citasLocal.map((cita) => {
              const estado = String(cita.estado || "").toLowerCase();
              const puedeCancelar =
                estado !== "cancelada" && estado !== "completada";

              return (
                <div
                  key={cita.id}
                  className={`appointment-item ${
                    selectedCitaId === cita.id ? "selected" : ""
                  }`}
                  onClick={() => onSelectCita(cita)}
                >
                  <div className="appointment-time">
                    <i className="fas fa-clock"></i>
                    <span>{formatHora(cita.fecha_hora)}</span>
                  </div>

                  <div className="appointment-info">
                    <div className="appointment-patient">
                      {cita.paciente_nombre}
                    </div>
                    <div className="appointment-treatment">
                      {cita.motivo || "Consulta general"}
                    </div>
                  </div>

                  <div className={`appointment-status status-${estado}`}>
                    {estado === "confirmada" && "Confirmada"}
                    {estado === "pendiente" && "Pendiente"}
                    {estado === "completada" && "Completada"}
                    {estado === "cancelada" && "Cancelada"}
                    {estado === "programada" && "Programada"}
                  </div>

                  <div
                    className="appointment-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="dm17-btn dm17-btn-small"
                      type="button"
                      onClick={() => setCitaCambio(cita)}
                      style={{ marginLeft: 8 }}
                    >
                      Cambiar consultorio
                    </button>

                    {puedeCancelar ? (
                      <button
                        className="dm17-btn dm17-btn-small dm17-btn-danger"
                        type="button"
                        onClick={(e) => abrirDialogoCancelar(e, cita)}
                        disabled={cancelandoId === cita.id}
                        style={{ marginLeft: 8 }}
                      >
                        {cancelandoId === cita.id
                          ? "Cancelando..."
                          : "Cancelar cita"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <CambiarConsultorioModal
          open={!!citaCambio}
          cita={citaCambio}
          onClose={() => setCitaCambio(null)}
          onUpdated={() => {
            setCitaCambio(null);
          }}
        />
      </div>

      {citaPendienteCancelar ? (
        <div className="modal-overlay" onClick={cerrarDialogoCancelar}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{ borderLeft: "4px solid #dc3545" }}
            >
              <h3>Cancelar cita</h3>
              <button className="modal-close" onClick={cerrarDialogoCancelar}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p>
                ¿Seguro que deseas cancelar la cita de{" "}
                <strong>
                  {citaPendienteCancelar.paciente_nombre || "este paciente"}
                </strong>
                ?
              </p>

              <p style={{ marginTop: 10, color: "#6b7280" }}>
                El consultorio asignado se liberará automáticamente.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={cerrarDialogoCancelar}
                disabled={!!cancelandoId}
              >
                No, volver
              </button>

              <button
                className="btn-danger"
                onClick={confirmarCancelarCita}
                disabled={!!cancelandoId}
              >
                {cancelandoId ? "Cancelando..." : "Sí, cancelar cita"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AppointmentsList;