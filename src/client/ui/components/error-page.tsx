const DEFAULT_CONTACT = 'support@euroedgeadmissiongroup.com';

export const ErrorPage = ({ message }: { message: string }) => (
  <div
    className="ee-container ee-stack ee-stack-sm ee-center"
    style={{ minHeight: '70vh', justifyContent: 'center', alignItems: 'center' }}
    role="alert"
  >
    <span className="ee-eyebrow" style={{ justifyContent: 'center' }}>
      ERROR
    </span>
    <h1 className="ee-h2" style={{ maxWidth: '20ch' }}>
      Something went wrong
    </h1>
    <p className="ee-lead ee-center">
      Please contact the site administrator at{' '}
      <a href={`mailto:${DEFAULT_CONTACT}`} className="ee-accent">
        {DEFAULT_CONTACT}
      </a>
      .
    </p>
    {message ? (
      <code
        className="ee-mono ee-muted"
        style={{ fontSize: '0.78rem', background: 'var(--ee-surface-2)', padding: '10px 14px', borderRadius: 8 }}
      >
        {message}
      </code>
    ) : null}
  </div>
);
