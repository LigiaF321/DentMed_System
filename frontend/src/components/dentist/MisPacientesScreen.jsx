import React, { useEffect, useMemo, useState } from 'react';
import {
  buscarPacientes,
  obtenerPacienteDetalle,
  obtenerPacientesRecientes,
} from '../../services/pacientes.service';
import './MisPacientesScreen.css';

const STORAGE_KEY = 'dm20_recent_patient_searches';

const filtrosIniciales = {
  edad_min: '',
  edad_max: '',
  fecha_ultima_visita_desde: '',
  fecha_ultima_visita_hasta: '',
  id_dentista: '',
  activo: '',
};

const leerBusquedasRecientes = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const guardarBusquedaReciente = (entry) => {
  try {
    const current = leerBusquedasRecientes();

    const filtradas = current.filter(
      (item) =>
        !(
          item.q === entry.q &&
          JSON.stringify(item.filtros) === JSON.stringify(entry.filtros)
        )
    );

    const updated = [entry, ...filtradas].slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error guardando búsquedas recientes:', error);
  }
};

const formatearFecha = (valor) => {
  if (!valor) return '-';

  try {
    return new Date(valor).toLocaleDateString('es-HN');
  } catch {
    return '-';
  }
};

const MisPacientesScreen = ({ onSelectPatient, dentistaInfo }) => {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busquedasRecientes, setBusquedasRecientes] = useState(leerBusquedasRecientes());
  const [backendRecientes, setBackendRecientes] = useState([]);
  const [dentistaInicializado, setDentistaInicializado] = useState(false);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  useEffect(() => {
    if (dentistaInfo?.id && !dentistaInicializado) {
      setFiltros((prev) => ({
        ...prev,
        id_dentista: String(dentistaInfo.id),
      }));
      setDentistaInicializado(true);
    }
  }, [dentistaInfo, dentistaInicializado]);

  useEffect(() => {
    const cargarRecientes = async () => {
      try {
        const data = await obtenerPacientesRecientes();
        setBackendRecientes(data?.ids || []);
      } catch (error) {
        console.error('Error cargando pacientes recientes:', error);
      }
    };

    cargarRecientes();
  }, []);

  useEffect(() => {
    const hasSearch = q.trim().length > 0;
    const hasFilters = Object.values(filtros).some((v) => String(v).trim() !== '');

    if (!hasSearch && !hasFilters) {
      setRows([]);
      setTotal(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const data = await buscarPacientes({
          q,
          page,
          limit,
          filtros,
        });

        setRows(data?.data || []);
        setTotal(data?.total || 0);

        if (hasSearch || hasFilters) {
          const entry = {
            q: q.trim(),
            filtros,
            timestamp: new Date().toISOString(),
          };

          guardarBusquedaReciente(entry);
          setBusquedasRecientes(leerBusquedasRecientes());
        }
      } catch (error) {
        console.error('Error buscando pacientes:', error);
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [q, page, limit, filtros]);

  const handleFiltroChange = (field, value) => {
    setPage(1);
    setFiltros((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const limpiarFiltros = () => {
    setPage(1);
    setFiltros({
      ...filtrosIniciales,
      id_dentista: dentistaInfo?.id ? String(dentistaInfo.id) : '',
    });
  };

  const aplicarBusquedaReciente = (item) => {
    setPage(1);
    setQ(item.q || '');
    setFiltros(item.filtros || filtrosIniciales);
  };

  const handleSelectPaciente = async (paciente) => {
    try {
      const detalle = await obtenerPacienteDetalle(paciente.id);
      onSelectPatient(detalle);
    } catch (error) {
      console.error('Error obteniendo detalle del paciente:', error);
    }
  };

  return (
    <div className="dm20-page">
      <div className="dm20-card">
        <div className="dm20-header">
          <div>
            <h2>Mis Pacientes</h2>
            <p>
              Busca por nombre, apellido, teléfono o documento y aplica filtros avanzados.
            </p>
          </div>
        </div>

        <div className="dm20-search-wrap">
          <input
            type="text"
            className="dm20-search-input"
            placeholder="Buscar por nombre, apellido, teléfono o documento..."
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>

        <div className="dm20-filters">
          <input
            type="number"
            placeholder="Edad mín."
            value={filtros.edad_min}
            onChange={(e) => handleFiltroChange('edad_min', e.target.value)}
          />

          <input
            type="number"
            placeholder="Edad máx."
            value={filtros.edad_max}
            onChange={(e) => handleFiltroChange('edad_max', e.target.value)}
          />

          <input
            type="date"
            value={filtros.fecha_ultima_visita_desde}
            onChange={(e) =>
              handleFiltroChange('fecha_ultima_visita_desde', e.target.value)
            }
          />

          <input
            type="date"
            value={filtros.fecha_ultima_visita_hasta}
            onChange={(e) =>
              handleFiltroChange('fecha_ultima_visita_hasta', e.target.value)
            }
          />

          <input
            type="number"
            placeholder="ID dentista"
            value={filtros.id_dentista}
            onChange={(e) => handleFiltroChange('id_dentista', e.target.value)}
          />

          <select
            value={filtros.activo}
            onChange={(e) => handleFiltroChange('activo', e.target.value)}
          >
            <option value="">Estado</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>

          <button type="button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>

        {busquedasRecientes.length > 0 && (
          <div className="dm20-section">
            <h4>Búsquedas recientes</h4>
            <div className="dm20-tags">
              {busquedasRecientes.map((item, index) => (
                <button
                  key={`${item.q}-${index}`}
                  className="dm20-tag"
                  onClick={() => aplicarBusquedaReciente(item)}
                >
                  {item.q || 'Filtros avanzados'}
                </button>
              ))}
            </div>
          </div>
        )}

        {backendRecientes.length > 0 && (
          <div className="dm20-section">
            <h4>Pacientes consultados recientemente</h4>
            <p className="dm20-muted">IDs: {backendRecientes.join(', ')}</p>
          </div>
        )}

        <div className="dm20-results">
          {loading ? (
            <div className="dm20-empty">Buscando pacientes...</div>
          ) : rows.length === 0 ? (
            <div className="dm20-empty">No hay resultados.</div>
          ) : (
            <table className="dm20-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Edad</th>
                  <th>Última visita</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((paciente) => (
                  <tr
                    key={paciente.id}
                    onClick={() => handleSelectPaciente(paciente)}
                  >
                    <td>{paciente.nombre_completo || paciente.nombre}</td>
                    <td>{paciente.documento || '-'}</td>
                    <td>{paciente.telefono || '-'}</td>
                    <td>{paciente.edad ?? '-'}</td>
                    <td>{formatearFecha(paciente.ultima_visita)}</td>
                    <td>
  <span
    className={`dm20-status-badge ${
      String(paciente.activo_texto).toLowerCase() === 'activo'
        ? 'activo'
        : 'inactivo'
    }`}
  >
    {paciente.activo_texto || '-'}
  </span>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dm20-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Anterior
          </button>

          <span>
            Página {page} de {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default MisPacientesScreen;
