import { useEffect, useMemo, useState } from 'react';
import './clinicHours.css';
import logoDentMed from '../../assets/dentmed-logo.png';

const DAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const DEFAULT_SCHEDULE = {
  mon: { open: true, start: '08:00', end: '17:00' },
  tue: { open: true, start: '08:00', end: '17:00' },
  wed: { open: true, start: '08:00', end: '17:00' },
  thu: { open: true, start: '08:00', end: '17:00' },
  fri: { open: true, start: '08:00', end: '17:00' },
  sat: { open: true, start: '08:00', end: '12:00' },
  sun: { open: false, start: '08:00', end: '12:00' },
};

const STORAGE_KEY = 'dentmed_clinic_hours_v1';
const EXC_KEY = 'dentmed_clinic_exceptions_v1';

function isValidRange(start, end) {
  return start && end && start < end;
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ClinicHoursScreen({ onBack }) {
  const [selectedDay, setSelectedDay] = useState('mon');
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [exceptions, setExceptions] = useState([]);
  const [copyTargets, setCopyTargets] = useState(() =>
    Object.fromEntries(DAYS.map((d) => [d.key, false]))
  );

  const [excForm, setExcForm] = useState({
    date: '',
    closed: true,
    start: '08:00',
    end: '17:00',
    note: '',
  });

  const [savedAt, setSavedAt] = useState(null);

  // cargar localStorage (si existe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSchedule({ ...DEFAULT_SCHEDULE, ...JSON.parse(raw) });
    } catch {}

    try {
      const rawE = localStorage.getItem(EXC_KEY);
      if (rawE) setExceptions(JSON.parse(rawE));
    } catch {}
  }, []);

  // validaciones
  const dayError = useMemo(() => {
    const d = schedule[selectedDay];
    if (!d.open) return '';
    if (!isValidRange(d.start, d.end))
      return 'La hora de inicio debe ser menor que la hora de fin.';
    return '';
  }, [schedule, selectedDay]);

  const excError = useMemo(() => {
    if (!excForm.date) return '';
    if (!excForm.closed && !isValidRange(excForm.start, excForm.end)) {
      return 'En excepción: inicio debe ser menor que fin.';
    }
    return '';
  }, [excForm]);

  function updateDay(patch) {
    setSchedule((prev) => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], ...patch },
    }));
  }

  function toggleCopyTarget(dayKey) {
    setCopyTargets((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));
  }

  function copyFromSelectedToTargets() {
    const source = schedule[selectedDay];
    const targets = Object.entries(copyTargets)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (targets.length === 0) return;

    setSchedule((prev) => {
      const next = { ...prev };
      targets.forEach((k) => {
        next[k] = { ...source };
      });
      return next;
    });

    // limpia selección
    setCopyTargets(Object.fromEntries(DAYS.map((d) => [d.key, false])));
  }

  function copyToWeekdays() {
    const source = schedule[selectedDay];
    setSchedule((prev) => ({
      ...prev,
      mon: { ...source },
      tue: { ...source },
      wed: { ...source },
      thu: { ...source },
      fri: { ...source },
    }));
  }

  function addException() {
    if (!excForm.date) return;
    if (!excForm.closed && !isValidRange(excForm.start, excForm.end)) return;

    // evitar duplicados por fecha (1 excepción por fecha)
    if (exceptions.some((e) => e.date === excForm.date)) return;

    const item = {
      id: makeId(),
      date: excForm.date,
      closed: !!excForm.closed,
      start: excForm.start,
      end: excForm.end,
      note: excForm.note?.trim() || '',
    };
    setExceptions((prev) => [...prev, item]);

    setExcForm({
      date: '',
      closed: true,
      start: '08:00',
      end: '17:00',
      note: '',
    });
  }

  function removeException(id) {
    setExceptions((prev) => prev.filter((e) => e.id !== id));
  }

  function saveAll() {
    for (const d of DAYS) {
      const v = schedule[d.key];
      if (v.open && !isValidRange(v.start, v.end)) {
        alert(
          `Revisá el horario de ${d.label}: inicio debe ser menor que fin.`
        );
        return;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    localStorage.setItem(EXC_KEY, JSON.stringify(exceptions));
    setSavedAt(new Date());
  }

  const selected = schedule[selectedDay];
  const savedLabel = savedAt
    ? `Guardado: ${savedAt.toLocaleString()}`
    : 'Aun trabajando';

  return (
    <div className="ch-page">
      {/* TOPBAR */}
      <header className="ch-topbar">
        <div className="ch-topbar-inner">
          <div className="ch-left">
            <div className="dm-left">
              <img
                src={logoDentMed}
                alt="DentMed"
                className="dm-logo dm-logo-shift"
              />
            </div>
          </div>

          <div className="ch-center">
            <div className="ch-title">HORARIOS DE ATENCIÓN</div>
            <div className="ch-subtitle">
              Configura el horario laboral de la clínica
            </div>
          </div>

          <div className="ch-right">
            <button
              className="ch-btn ch-btn-ghost"
              type="button"
              onClick={() => onBack && onBack()}
            >
              <i className="fa-solid fa-arrow-left" /> Volver
            </button>
            <button className="ch-btn" type="button" onClick={saveAll}>
              <i className="fa-solid fa-floppy-disk" /> Guardar cambios
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="ch-main">
        <div className="ch-meta">
          <div className="ch-meta-pill">
            <i className="fa-solid fa-circle-info" /> {savedLabel}
          </div>
        </div>

        <div className="ch-grid">
          {/* LISTA DE DÍAS */}
          <section className="ch-card">
            <div className="ch-card-title">
              <i className="fa-solid fa-calendar-week" /> Días de la semana
            </div>

            <div className="ch-daylist">
              {DAYS.map((d) => {
                const info = schedule[d.key];
                const active = d.key === selectedDay;

                return (
                  <button
                    key={d.key}
                    type="button"
                    className={`ch-day ${active ? 'is-active' : ''}`}
                    onClick={() => setSelectedDay(d.key)}
                  >
                    <div className="ch-day-name">{d.label}</div>
                    <div className={`ch-day-badge ${info.open ? 'ok' : 'off'}`}>
                      {info.open ? `${info.start} - ${info.end}` : 'Cerrado'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="ch-divider" />

            <div className="ch-copy">
              <div className="ch-copy-title">
                <i className="fa-solid fa-copy" /> Copiar horario del día
                seleccionado
              </div>

              <button
                className="ch-btn ch-btn-secondary"
                type="button"
                onClick={copyToWeekdays}
              >
                Copiar a Lun–Vie
              </button>

              <div className="ch-copy-sub">O elegí días específicos:</div>

              <div className="ch-copy-targets">
                {DAYS.map((d) => (
                  <label key={d.key} className="ch-check">
                    <input
                      type="checkbox"
                      checked={!!copyTargets[d.key]}
                      onChange={() => toggleCopyTarget(d.key)}
                      disabled={d.key === selectedDay}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>

              <button
                className="ch-btn ch-btn-secondary"
                type="button"
                onClick={copyFromSelectedToTargets}
              >
                Aplicar copia
              </button>
            </div>
          </section>

          {/* EDITOR DEL DÍA */}
          <section className="ch-card">
            <div className="ch-card-title">
              <i className="fa-solid fa-pen-to-square" /> Editar:{' '}
              {DAYS.find((d) => d.key === selectedDay)?.label}
            </div>

            <div className="ch-row">
              <label className="ch-switch">
                <input
                  type="checkbox"
                  checked={!!selected.open}
                  onChange={(e) => updateDay({ open: e.target.checked })}
                />
                <span className="ch-switch-ui" />
                <span className="ch-switch-text">
                  {selected.open ? 'Abierto' : 'Cerrado'}
                </span>
              </label>
            </div>

            {selected.open && (
              <div className="ch-times">
                <div className="ch-field">
                  <label>Hora de inicio</label>
                  <input
                    type="time"
                    value={selected.start}
                    onChange={(e) => updateDay({ start: e.target.value })}
                  />
                </div>

                <div className="ch-field">
                  <label>Hora de fin</label>
                  <input
                    type="time"
                    value={selected.end}
                    onChange={(e) => updateDay({ end: e.target.value })}
                  />
                </div>
              </div>
            )}

            {dayError && (
              <div className="ch-error">
                <i className="fa-solid fa-triangle-exclamation" /> {dayError}
              </div>
            )}

            <div className="ch-hint">
              <i className="fa-solid fa-lightbulb" />
              Tip: podés tener horarios distintos por día y copiar el horario a
              otros días.
            </div>
          </section>

          {/* EXCEPCIONES / FERIADOS */}
          <section className="ch-card ch-span-2">
            <div className="ch-card-title">
              <i className="fa-solid fa-calendar-xmark" /> Excepciones /
              Feriados
            </div>

            <div className="ch-exc-grid">
              <div className="ch-field">
                <label>Fecha</label>
                <input
                  type="date"
                  value={excForm.date}
                  onChange={(e) =>
                    setExcForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>

              <div className="ch-field">
                <label>Tipo</label>
                <select
                  value={excForm.closed ? 'closed' : 'custom'}
                  onChange={(e) =>
                    setExcForm((p) => ({
                      ...p,
                      closed: e.target.value === 'closed',
                    }))
                  }
                >
                  <option value="closed">Feriado (cerrado)</option>
                  <option value="custom">Horario especial</option>
                </select>
              </div>

              {!excForm.closed && (
                <>
                  <div className="ch-field">
                    <label>Inicio</label>
                    <input
                      type="time"
                      value={excForm.start}
                      onChange={(e) =>
                        setExcForm((p) => ({ ...p, start: e.target.value }))
                      }
                    />
                  </div>
                  <div className="ch-field">
                    <label>Fin</label>
                    <input
                      type="time"
                      value={excForm.end}
                      onChange={(e) =>
                        setExcForm((p) => ({ ...p, end: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}

              <div className="ch-field ch-grow">
                <label>Nota (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Día festivo nacional / Jornada reducida"
                  value={excForm.note}
                  onChange={(e) =>
                    setExcForm((p) => ({ ...p, note: e.target.value }))
                  }
                />
              </div>

              <button className="ch-btn" type="button" onClick={addException}>
                <i className="fa-solid fa-plus" /> Agregar
              </button>
            </div>

            {excError && (
              <div className="ch-error">
                <i className="fa-solid fa-triangle-exclamation" /> {excError}
              </div>
            )}
            {excForm.date &&
              exceptions.some((e) => e.date === excForm.date) && (
                <div className="ch-error">
                  <i className="fa-solid fa-triangle-exclamation" /> Ya existe
                  una excepción para esa fecha.
                </div>
              )}

            <div className="ch-divider" />

            {exceptions.length === 0 ? (
              <div className="ch-empty">
                <i className="fa-regular fa-calendar" />
                No hay excepciones todavía.
              </div>
            ) : (
              <div className="ch-exc-list">
                {exceptions
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((e) => (
                    <div key={e.id} className="ch-exc-item">
                      <div className="ch-exc-date">
                        <i className="fa-solid fa-calendar-day" /> {e.date}
                      </div>

                      <div className="ch-exc-type">
                        {e.closed ? (
                          <span className="ch-pill danger">Cerrado</span>
                        ) : (
                          <span className="ch-pill ok">
                            {e.start} - {e.end}
                          </span>
                        )}
                        {e.note ? (
                          <span className="ch-note">• {e.note}</span>
                        ) : null}
                      </div>

                      <button
                        className="ch-iconbtn"
                        type="button"
                        onClick={() => removeException(e.id)}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>

        <div className="ch-footer">
          © 2026 DentMed — Configuración de horarios
        </div>
      </main>
    </div>
  );
}
