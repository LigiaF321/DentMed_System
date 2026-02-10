export default function MetricCard({ title, value, icon, hint, danger = false }) {
  return (
    <div className={`dm-card p-3 p-md-4 ${danger ? "dm-card-danger" : ""}`}>
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <div className="dm-card-title">{title}</div>
          <div className="dm-metric">{value}</div>
          <div className="dm-card-subtitle">{hint}</div>
        </div>

        <div className="dm-icon">
          <i className={icon} />
        </div>
      </div>
    </div>
  );
}