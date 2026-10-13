export default function Logo({ compact = false }) {
  return (
    <span className="brand">
      <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="4" y="4" width="40" height="40" rx="10" fill="#0b1f3a" />
        <path d="M14 25.5l6.2 6.2L34 17.8" fill="none" stroke="#7dcea0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <span>
          <strong>NirmaanWatch AI</strong>
          <small>Track Public Projects. Build Public Trust.</small>
        </span>
      )}
    </span>
  );
}
