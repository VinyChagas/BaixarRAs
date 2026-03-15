import './LogPanel.css';

export default function LogPanel({ logs }) {
  return (
    <div className="log-panel">
      <h3>Logs / Status</h3>
      <div className="log-content">
        {logs.length === 0 ? (
          <p className="log-empty">Aguardando execução...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`log-entry log-${log.type}`}>
              <span className="log-time">{log.time}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
