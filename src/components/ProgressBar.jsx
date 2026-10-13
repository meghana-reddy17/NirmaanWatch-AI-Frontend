export default function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} role="progressbar">
      <span style={{ width: `${pct}%` }} />
      <em>{pct}%</em>
    </div>
  );
}
