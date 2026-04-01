import React, { useEffect, useMemo, useState } from "react";
import {
  buscarPacientes,
  crearPacienteRapido,
} from "../../services/pacientes.service";
import {
  verificarDisponibilidad,
  crearCita,
} from "../../services/citas.service";
import "./NuevaCitaModal.css";

const DURACIONES = [30, 45, 60];

const getToday = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

function CrearPacienteRapidoModal({
  open,
  onClose,
  onCreated,
  initialName = "",
}) {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        nombre: initialName || "",
        telefono: "",
        email: "",
      });
      setSaving(false);
      setError("");
    }
  }, [open, initialName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);

      const response = await crearPacienteRapido({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
      });

      if (response?.data) {
        onCreated(response.data);
      }

      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear el paciente");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="dm17-overlay">
      <div className="dm17-modal dm17-modal-small">
        <div className="dm17-modal-header">
          <h3>Crear nuevo paciente</h3>
          <button type="button" className="dm17-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="dm17-form" onSubmit={handleSubmit}>
          <div className="dm17-grid">
            <div className="dm17-field dm17-field-full">
              <label>Nombre completo</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ingrese el nombre del paciente"
                required
              />
            </div>

            <div className="dm17-field">
              <label>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej. 9999-9999"
              />
            </div>

            <div className="dm17-field">
              <label>Correo</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          {error ? <div className="dm17-error">{error}</div> : null}

          <div className="dm17-actions">
            <button
              type="button"
              className="dm17-btn dm17-btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="dm17-btn dm17-btn-primary"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NuevaCitaModal({
  open,
  onClose,
  onCreated,
  consultorios = [],
}) {
  const [form, setForm] = useState({
    paciente: null,
    queryPaciente: "",
    fecha: getToday(),
    hora: "",
    duracion: 30,
    id_consultorio: "",
    motivo: "",
  });

  const [resultados, setResultados] = useState([]);
  const [searching, setSearching] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCrearPaciente, setShowCrearPaciente] = useState(false);
  const [error, setError] = useState("");
  const [disponibilidad, setDisponibilidad] = useState({
    disponible: true,
    message: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        paciente: null,
        queryPaciente: "",
        fecha: getToday(),
        hora: "",
        duracion: 30,
        id_consultorio: "",
        motivo: "",
      });
      setResultados([]);
      setSearching(false);
      setChecking(false);
      setSaving(false);
      setShowCrearPaciente(false);
      setError("");
      setDisponibilidad({
        disponible: true,
        message: "",
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!consultorios.length) return;

    setForm((prev) => {
      if (prev.id_consultorio) return prev;

      return {
        ...prev,
        id_consultorio: String(consultorios[0].id),
      };
    });
  }, [open, consultorios]);

  useEffect(() => {
    if (!open) return;
    if (form.paciente) return;

    const query = form.queryPaciente.trim();

    if (query.length < 2) {
      setResultados([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await buscarPacientes(query);
        setResultados(response?.data || []);
      } catch (err) {
        console.error("Error buscando pacientes:", err);
        setResultados([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.queryPaciente, form.paciente, open]);

  useEffect(() => {
    if (!open) return;

    if (!form.fecha || !form.hora || !form.duracion || !form.id_consultorio) {
      setDisponibilidad({
        disponible: true,
        message: "",
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setChecking(true);

        const response = await verificarDisponibilidad({
          fecha: form.fecha,
          hora: form.hora,
          duracion: form.duracion,
          id_consultorio: form.id_consultorio,
        });

        setDisponibilidad({
          disponible: !!response.disponible,
          message: response.message || "",
        });
      } catch (err) {
        setDisponibilidad({
          disponible: false,
          message: err.message || "No se pudo verificar disponibilidad",
        });
      } finally {
        setChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.fecha, form.hora, form.duracion, form.id_consultorio, open]);

  const canSave = useMemo(() => {
    return (
      !!form.paciente &&
      !!form.fecha &&
      !!form.hora &&
      !!form.duracion &&
      !!form.id_consultorio &&
      disponibilidad.disponible &&
      !saving
    );
  }, [form, disponibilidad.disponible, saving]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const seleccionarPaciente = (paciente) => {
    setForm((prev) => ({
      ...prev,
      paciente,
      queryPaciente: paciente.nombre,
    }));
    setResultados([]);
  };

  const limpiarPaciente = () => {
    setForm((prev) => ({
      ...prev,
      paciente: null,
      queryPaciente: "",
    }));
    setResultados([]);
  };

  const handlePacienteCreado = (paciente) => {
    seleccionarPaciente(paciente);
    setShowCrearPaciente(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!canSave) return;

    try {
      setSaving(true);

      const response = await crearCita({
        id_paciente: form.paciente.id,
        fecha: form.fecha,
        hora: form.hora,
        duracion: Number(form.duracion),
        id_consultorio: form.id_consultorio
          ? Number(form.id_consultorio)
          : null,
        motivo: form.motivo.trim(),
      });

      if (onCreated) {
        onCreated(response);
      }

      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear la cita");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="dm17-overlay">
        <div className="dm17-modal">
          <div className="dm17-modal-header">
            <h3>Nueva cita</h3>
            <button type="button" className="dm17-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <form className="dm17-form" onSubmit={handleSubmit}>
            <div className="dm17-field dm17-field-full dm17-typeahead-wrap">
              <label>Paciente</label>

              <div className="dm17-typeahead-input-wrap">
                <input
                  type="text"
                  name="queryPaciente"
                  value={form.queryPaciente}
                  onChange={handleChange}
                  placeholder="Buscar por nombre, teléfono o correo"
                />

                {form.paciente ? (
                  <button
                    type="button"
                    className="dm17-chip-clear"
                    onClick={limpiarPaciente}
                  >
                    Cambiar
                  </button>
                ) : null}
              </div>

              {!form.paciente && searching ? (
                <div className="dm17-help">Buscando pacientes...</div>
              ) : null}

              {!form.paciente && resultados.length > 0 ? (
                <div className="dm17-typeahead-list">
                  {resultados.map((paciente) => (
                    <button
                      key={paciente.id}
                      type="button"
                      className="dm17-typeahead-item"
                      onClick={() => seleccionarPaciente(paciente)}
                    >
                      <strong>{paciente.nombre}</strong>
                      <span>
                        {paciente.telefono ||
                          paciente.email ||
                          "Sin información adicional"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {!form.paciente &&
              form.queryPaciente.trim().length >= 2 &&
              !searching &&
              resultados.length === 0 ? (
                <div className="dm17-empty-search">
                  <span>No se encontró el paciente.</span>
                  <button
                    type="button"
                    className="dm17-link-btn"
                    onClick={() => setShowCrearPaciente(true)}
                  >
                    Crear nuevo paciente
                  </button>
                </div>
              ) : null}
            </div>

            <div className="dm17-grid">
              <div className="dm17-field">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="dm17-field">
                <label>Hora</label>
                <input
                  type="time"
                  name="hora"
                  value={form.hora}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="dm17-field">
                <label>Duración</label>
                <select
                  name="duracion"
                  value={form.duracion}
                  onChange={handleChange}
                >
                  {DURACIONES.map((duracion) => (
                    <option key={duracion} value={duracion}>
                      {duracion} min
                    </option>
                  ))}
                </select>
              </div>

              <div className="dm17-field">
                <label>Consultorio</label>
                <select
                  name="id_consultorio"
                  value={form.id_consultorio}
                  onChange={handleChange}
                  required
                  disabled={!consultorios.length}
                >
                  <option value="">
                    {consultorios.length
                      ? "Seleccione"
                      : "No hay consultorios disponibles"}
                  </option>
                  {consultorios.map((consultorio) => (
                    <option key={consultorio.id} value={String(consultorio.id)}>
                      {consultorio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dm17-field dm17-field-full">
                <label>Motivo</label>
                <input
                  type="text"
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  placeholder="Ej. Limpieza, revisión, extracción"
                />
              </div>
            </div>

            {!consultorios.length ? (
              <div className="dm17-error">
                No hay consultorios disponibles para agendar.
              </div>
            ) : null}

            {checking ? (
              <div className="dm17-help">Verificando disponibilidad...</div>
            ) : null}

            {!checking &&
            form.fecha &&
            form.hora &&
            form.id_consultorio &&
            disponibilidad.disponible ? (
              <div className="dm17-success">Horario disponible</div>
            ) : null}

            {!disponibilidad.disponible ? (
              <div className="dm17-error">{disponibilidad.message}</div>
            ) : null}

            {error ? <div className="dm17-error">{error}</div> : null}

            <div className="dm17-actions">
              <button
                type="button"
                className="dm17-btn dm17-btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="dm17-btn dm17-btn-primary"
                disabled={!canSave}
              >
                {saving ? "Guardando..." : "Guardar cita"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CrearPacienteRapidoModal
        open={showCrearPaciente}
        onClose={() => setShowCrearPaciente(false)}
        onCreated={handlePacienteCreado}
        initialName={form.queryPaciente}
      />
    </>
  );
}