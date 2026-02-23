const badge = (tipo) => {
  const t = (tipo || "").toLowerCase();
  if (t === "urgente") return "dm-pill dm-pill-alta";
  if (t === "pendiente") return "dm-pill dm-pill-media";
  return "dm-pill dm-pill-media";
};

export default function ImportantNotifications({ items = [], onOpenCenter }) {
  return (
    <div className="dm-card p-3 p-md-4">
      <div className="dm-card-title">
        <i className="fa-solid fa-bell me-2" />
        Notificaciones importantes
      </div>
      <div className="dm-card-subtitle">Prioriza lo importante</div>

      <div className="dm-alerts mt-3">
        {items.map((n, idx) => (
          <div className="dm-alert" key={idx}>
            <span className={badge(n.tipo)}>{n.tipo}</span>
            <div style={{ flex: 1 }}>
              <div className="dm-alert-title">{n.mensaje}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="dm-cta mt-3" type="button" onClick={onOpenCenter}>
        VER CENTRO DE NOTIFICACIONES →
      </button>
    </div>
  );
}