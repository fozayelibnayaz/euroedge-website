export const LoadingSpinner = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--ee-bg)',
    }}
    role="status"
    aria-live="polite"
  >
    <div className="ee-stack ee-stack-sm ee-center" style={{ alignItems: 'center' }}>
      <span
        className="ee-anim-spin"
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '2px solid var(--ee-line)',
          borderTopColor: 'var(--ee-accent)',
          display: 'block',
          animationDuration: '0.9s',
        }}
      />
      <span className="ee-faint" style={{ fontSize: '0.8rem' }}>
        Loading EuroEdge…
      </span>
    </div>
  </div>
);
