function Substitutes({ substitutes }) {
  return (
    <section className="card">
      <h3>Nigeria ↔ U.S. Food Alternatives</h3>

      <p className="muted">
        Useful substitutions for Nigerian meals in the U.S.
      </p>

      <div className="sub-grid">
        {substitutes.map(([ng, us]) => (
          <div className="sub-card" key={ng}>
            <strong>{ng}</strong>
            <span>→</span>
            <strong>{us}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Substitutes;