export default function EchoStatePanel({ state }) {
  if (!state) return null;
  const items = [
    { label: 'densité', value: state.density },
    { label: 'flux', value: state.flow },
    { label: 'tension', value: state.tension },
    { label: 'entropie', value: state.entropy },
    { label: 'polarité', value: state.polarity },
  ];

  return (
    <div className="panel">
      <h2>EchoState</h2>
      <p className="muted">Seed stable : {state.seed} — timestamp : {new Date(state.timestamp).toLocaleString('fr-FR')}</p>
      <div className="state-grid">
        {items.map((item) => (
          <div key={item.label} className="state-cell">
            <span className="muted">{item.label}</span>
            <strong>{item.value.toFixed(3)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
