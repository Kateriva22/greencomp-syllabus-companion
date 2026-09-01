export default function LimitationsPanel({ limitations }: { limitations: string[] }) {
  return (
    <section className="card" aria-labelledby="limitations-heading">
      <h2 id="limitations-heading">Limitations and confidence</h2>
      <ul>
        {limitations.map((l, i) => (
          <li key={i} className="helper-text">
            {l}
          </li>
        ))}
      </ul>
    </section>
  );
}
