export default function StockCriticalTable({ items = [], onViewAll }) {
  return (
    <div className="dm-card p-3 p-md-4">
      <div className="dm-card-title">
        <i className="fa-solid fa-boxes-stacked me-2" />
        Stock crítico en inventario
      </div>
      <div className="dm-card-subtitle">Productos por debajo o igual al mínimo</div>

      <div className="table-responsive mt-3">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-muted">
                  Sin productos críticos
                </td>
              </tr>
            ) : (
              items.map((p, idx) => (
                <tr key={`${p.nombre}-${idx}`}>
                  <td>{p.nombre}</td>
                  <td>{p.stock_actual}</td>
                  <td>{p.stock_minimo}</td>
                  <td>
                    {p.nivel === "critico" ? "🔴" : "🟡"} {p.nivel}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button className="dm-cta mt-3" type="button" onClick={onViewAll}>
        VER INVENTARIO COMPLETO →
      </button>
    </div>
  );
}