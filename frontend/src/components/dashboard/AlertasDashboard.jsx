import { useEffect, useState } from "react";

export default function AlertasDashboard({ token }) {
  const [alertas, setAlertas] = useState([]);
  const [totales, setTotales] = useState({ criticas: 0, preventivas: 0 });

  async function loadResumen() {
    const res = await fetch("/api/admin/alertas/resumen", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAlertas(data.alertas);
    setTotales({ criticas: data.total_criticas, preventivas: data.total_preventivas });
  }

  useEffect(() => {
    loadResumen();
    const interval = setInterval(loadResumen, 300000); // cada 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="alertas-dashboard">
      <h3>Alertas de Inventario</h3>
      <div>Críticas: {totales.criticas}</div>
      <div>Preventivas: {totales.preventivas}</div>
      <ul>
        {alertas.map((a) => (
          <li key={a.id}>
            {a.insumo}: {a.stock_actual} / {a.stock_minimo} - {a.nivel.toUpperCase()}
          </li>
        ))}
      </ul>
      <a href="/alertas"> Ver todas las alertas</a>
    </div>
  );
}