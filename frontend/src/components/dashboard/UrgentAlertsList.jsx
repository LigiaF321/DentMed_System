export default function UrgentAlertsList({ alerts }) {
  return (
    <div className="dm-alerts">
      {alerts.map((a) => (
        <div key={a.id} className="dm-alert">
          <div className={`dm-pill dm-pill-${a.level}`}>{a.level}</div>
          <div className="dm-alert-body">
            <div className="dm-alert-title">{a.title}</div>
            <div className="dm-alert-time">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}