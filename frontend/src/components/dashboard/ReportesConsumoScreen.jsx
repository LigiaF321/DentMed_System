import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./ReportesConsumoScreen.css";

const TAB_MATERIALES = "materiales-criticos";
const TAB_CONSUMO = "consumo-mensual";
const TAB_TENDENCIAS = "tendencias-6-meses";
const TAB_SUGERENCIA = "sugerencia-compra";

const MONTH_NAMES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

function money(v) {
  return `L ${Number(v || 0).toFixed(2)}`;
}

function percent(v) {
  const n = Number(v || 0);
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function priorityLabel(value) {
  if (value === "critico") return "CRÍTICO";
  if (value === "alerta") return "ALERTA";
  return "NORMAL";
}

function priorityClass(value) {
  if (value === "critico") return "critico";
  if (value === "alerta") return "alerta";
  return "normal";
}

export default function ReportesConsumoScreen() {
  const now = new Date();
  const [tab, setTab] = useState(TAB_MATERIALES);
  const [loading, setLoading] = useState(false);

  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [categoria, setCategoria] = useState("TODAS");
  const [comparar, setComparar] = useState(true);

  const [categorias, setCategorias] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [consumoMensual, setConsumoMensual] = useState({ chart: [], tabla: [] });
  const [tendencias, setTendencias] = useState({ categorias: [], chart: [], resumen: {} });
  const [sugerencias, setSugerencias] = useState({ data: [], total_estimado: 0, meses_cobertura: 2.5 });
  const [comparativa, setComparativa] = useState(null);
  const [message, setMessage] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      mes: String(mes),
      anio: String(anio),
      categoria,
    });
    return params.toString();
  }, [mes, anio, categoria]);

  const cargarTodo = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

      const [catsRes, criticosRes, consumoRes, tendenciasRes, sugerenciasRes, comparativaRes] =
        await Promise.all([
          fetch("/api/admin/reportes/categorias"),
          fetch(`/api/admin/reportes/materiales-criticos?${queryString}`),
          fetch(`/api/admin/reportes/consumo-mensual?${queryString}`),
          fetch(`/api/admin/reportes/tendencias-6-meses?${queryString}`),
          fetch(`/api/admin/reportes/sugerencia-compra?${queryString}`),
          comparar
            ? fetch(`/api/admin/reportes/comparativa-mensual?${queryString}`)
            : Promise.resolve({ ok: true, json: async () => null }),
        ]);

      const [cats, criticos, consumo, tendenciasData, sugerenciaData, comparativaData] =
        await Promise.all([
          catsRes.json(),
          criticosRes.json(),
          consumoRes.json(),
          tendenciasRes.json(),
          sugerenciasRes.json(),
          comparativaRes.json(),
        ]);

      setCategorias(["TODAS", ...cats]);
      setMateriales(criticos.data || []);
      setConsumoMensual(consumo || { chart: [], tabla: [] });
      setTendencias(tendenciasData || { categorias: [], chart: [], resumen: {} });
      setSugerencias(sugerenciaData || { data: [], total_estimado: 0, meses_cobertura: 2.5 });
      setComparativa(comparativaData);
    } catch (error) {
      console.error(error);
      setMessage("No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, [queryString, comparar]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  async function exportar(formato) {
    try {
      const params = new URLSearchParams({
        tipo_reporte: tab,
        formato,
        mes: String(mes),
        anio: String(anio),
        categoria,
      });

      const res = await fetch(`/api/admin/reportes/exportar?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "No se pudo exportar el reporte");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tab}.${formato === "excel" ? "csv" : formato}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="rpt-page">
      <div className="rpt-head">
        <div>
          <div className="rpt-title">Reportes de Consumo para Planificación</div>
          <div className="rpt-sub">
            Análisis de consumo y sugerencias inteligentes de compra
          </div>
        </div>

        <div className="rpt-headActions">
          <button
            className={`rpt-btn ${tab === TAB_MATERIALES ? "rpt-btn--primary" : ""}`}
            type="button"
            onClick={() => setTab(TAB_MATERIALES)}
          >
            <i className="fa-solid fa-clipboard-list" />
            <span>Materiales críticos</span>
          </button>

          <button
            className={`rpt-btn ${tab === TAB_CONSUMO ? "rpt-btn--primary" : ""}`}
            type="button"
            onClick={() => setTab(TAB_CONSUMO)}
          >
            <i className="fa-solid fa-chart-column" />
            <span>Consumo mensual</span>
          </button>

          <button
            className={`rpt-btn ${tab === TAB_TENDENCIAS ? "rpt-btn--primary" : ""}`}
            type="button"
            onClick={() => setTab(TAB_TENDENCIAS)}
          >
            <i className="fa-solid fa-chart-line" />
            <span>Tendencias 6 meses</span>
          </button>

          <button
            className={`rpt-btn ${tab === TAB_SUGERENCIA ? "rpt-btn--primary" : ""}`}
            type="button"
            onClick={() => setTab(TAB_SUGERENCIA)}
          >
            <i className="fa-solid fa-cart-shopping" />
            <span>Sugerencia de compra</span>
          </button>

          <button className="rpt-btn" type="button" onClick={() => exportar("excel")}>
            <i className="fa-solid fa-file-export" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      <div className="rpt-card">
        <div className="rpt-cardHead">
          <div className="rpt-cardTitle">Filtros generales</div>
        </div>

        <div className="rpt-cardBody">
          <div className="rpt-filters">
            <div className="rpt-field">
              <label>Período</label>
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m} {anio}
                  </option>
                ))}
              </select>
            </div>

            <div className="rpt-field">
              <label>Año</label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
              />
            </div>

            <div className="rpt-field">
              <label>Categoría</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {categorias.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="rpt-field rpt-field--check">
              <label>Comparar con mes anterior</label>
              <input
                type="checkbox"
                checked={comparar}
                onChange={(e) => setComparar(e.target.checked)}
              />
            </div>

            <div className="rpt-actions">
              <button className="rpt-btn rpt-btn--primary" type="button" onClick={cargarTodo}>
                <i className="fa-solid fa-rotate" />
                <span>Aplicar filtros</span>
              </button>
            </div>
          </div>

          {message ? <div className="rpt-alert rpt-alert--error">{message}</div> : null}
          {loading ? <div className="rpt-empty">Cargando reportes...</div> : null}
        </div>
      </div>

      {tab === TAB_MATERIALES && !loading && (
        <div className="rpt-card">
          <div className="rpt-cardHead">
            <div className="rpt-cardTitle">Materiales críticos</div>
          </div>
          <div className="rpt-cardBody">
            <div className="rpt-tableWrap">
              <table className="rpt-table">
                <thead>
                  <tr>
                    <th>Prioridad</th>
                    <th>Insumo</th>
                    <th>Stock actual</th>
                    <th>Stock mínimo</th>
                    <th>Consumo promedio</th>
                    <th>Días estimados</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="rpt-emptyCell">
                        No hay datos para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    materiales.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={`rpt-badge rpt-badge--${priorityClass(item.prioridad)}`}>
                            {priorityLabel(item.prioridad)}
                          </span>
                        </td>
                        <td>{item.insumo}</td>
                        <td>{item.stock_actual}</td>
                        <td>{item.stock_minimo}</td>
                        <td>{item.consumo_promedio.toFixed(2)} und/mes</td>
                        <td>{item.dias_estimados ? `${item.dias_estimados.toFixed(0)} días` : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === TAB_CONSUMO && !loading && (
        <div className="rpt-grid">
          <div className="rpt-card">
            <div className="rpt-cardHead">
              <div className="rpt-cardTitle">Consumo mensual por categoría</div>
            </div>
            <div className="rpt-cardBody">
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={consumoMensual.chart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rpt-card">
            <div className="rpt-cardHead">
              <div className="rpt-cardTitle">Comparativa por categoría</div>
            </div>
            <div className="rpt-cardBody">
              <div className="rpt-tableWrap">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Consumo actual</th>
                      <th>Mes anterior</th>
                      <th>Variación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(consumoMensual.tabla || []).map((item) => (
                      <tr key={item.categoria}>
                        <td>{item.categoria}</td>
                        <td>{item.consumo_actual}</td>
                        <td>{item.consumo_anterior}</td>
                        <td className={item.variacion >= 0 ? "rpt-up" : "rpt-down"}>
                          {percent(item.variacion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === TAB_TENDENCIAS && !loading && (
        <div className="rpt-grid">
          <div className="rpt-card">
            <div className="rpt-cardHead">
              <div className="rpt-cardTitle">Histórico de consumo (6 meses)</div>
            </div>
            <div className="rpt-cardBody">
              <div style={{ width: "100%", height: 340 }}>
                <ResponsiveContainer>
                  <LineChart data={tendencias.chart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {tendencias.categorias.map((cat) => (
                      <Line
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rpt-card">
            <div className="rpt-cardHead">
              <div className="rpt-cardTitle">Análisis de tendencias</div>
            </div>
            <div className="rpt-cardBody">
              <div className="rpt-miniList">
                <div><strong>Tendencia general:</strong> {tendencias.resumen?.tendencia_general || "—"}</div>
                <div><strong>Mes con mayor consumo:</strong> {tendencias.resumen?.mes_mayor_consumo || "—"}</div>
                <div><strong>Categoría con mayor crecimiento:</strong> {tendencias.resumen?.categoria_mayor_crecimiento || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === TAB_SUGERENCIA && !loading && (
        <div className="rpt-grid">
          <div className="rpt-card">
            <div className="rpt-cardHead">
              <div className="rpt-cardTitle">Sugerencia de compra inteligente</div>
            </div>
            <div className="rpt-cardBody">
              <div className="rpt-miniNote">
                Basado en consumo promedio de los últimos {sugerencias.meses_cobertura} meses de cobertura.
              </div>

              <div className="rpt-tableWrap">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Consumo promedio</th>
                      <th>Stock actual</th>
                      <th>Recomendación</th>
                      <th>Costo unitario</th>
                      <th>Costo total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sugerencias.data || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="rpt-emptyCell">
                          No hay sugerencias de compra para este período.
                        </td>
                      </tr>
                    ) : (
                      sugerencias.data.map((item) => (
                        <tr key={item.id}>
                          <td>{item.insumo}</td>
                          <td>{item.consumo_promedio.toFixed(2)} und/mes</td>
                          <td>{item.stock_actual}</td>
                          <td>{item.recomendacion} und</td>
                          <td>{money(item.costo_unitario)}</td>
                          <td>{money(item.costo_total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rpt-total">
                Total estimado de compra: <strong>{money(sugerencias.total_estimado)}</strong>
              </div>
            </div>
          </div>

          {comparativa ? (
            <div className="rpt-card">
              <div className="rpt-cardHead">
                <div className="rpt-cardTitle">Comparativa mensual</div>
              </div>
              <div className="rpt-cardBody">
                <div className="rpt-miniList">
                  <div>
                    <strong>Variación general:</strong>{" "}
                    <span className={comparativa.variacion_general >= 0 ? "rpt-up" : "rpt-down"}>
                      {percent(comparativa.variacion_general)}
                    </span>
                  </div>
                  <div>
                    <strong>Categoría con mayor aumento:</strong>{" "}
                    {comparativa.mayor_aumento?.categoria || "—"}
                  </div>
                  <div>
                    <strong>Categoría con mayor disminución:</strong>{" "}
                    {comparativa.mayor_disminucion?.categoria || "—"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}