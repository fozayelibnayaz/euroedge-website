import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { LuCheck, LuPencil, LuPlus, LuTrash2, LuX, LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { Link } from 'react-router';

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  iconRight,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) => {
  const sizeClass = size === 'sm' ? 'ee-btn-sm' : size === 'lg' ? 'ee-btn-lg' : '';
  return (
    <button
      type={type}
      className={`ee-btn ee-btn-${variant} ${sizeClass} ${block ? 'ee-btn-block' : ''} ${className}`.trim()}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
};

interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  external?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const LinkButton = ({
  to,
  variant = 'primary',
  size = 'md',
  external = false,
  icon,
  iconRight,
  children,
  className = '',
}: LinkButtonProps) => {
  const sizeClass = size === 'sm' ? 'ee-btn-sm' : size === 'lg' ? 'ee-btn-lg' : '';
  const classes = `ee-btn ee-btn-${variant} ${sizeClass} ${className}`.trim();

  if (external || to.startsWith('http')) {
    return (
      <a href={to} className={classes} target="_blank" rel="noreferrer noopener">
        {icon}
        {children}
        {iconRight}
      </a>
    );
  }

  return (
    <Link to={to} className={classes}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
};

export const ActionLink = ({
  href,
  children,
  className = '',
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) => {
  // A caller asking for the secondary treatment must not also inherit the
  // primary fill — carrying both left light-mode text white on a white
  // button, which is how "See destinations" disappeared.
  const base = className.includes('ee-btn-secondary') ? 'ee-btn' : 'ee-btn ee-btn-primary';

  if (href.startsWith('#') && onClick) {
    return (
      <button type="button" className={`${base} ${className}`.trim()} onClick={onClick}>
        {children}
      </button>
    );
  }
  if (href.startsWith('http')) {
    return (
      <a href={href} className={`${base} ${className}`.trim()} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={`${base} ${className}`.trim()}>
      {children}
    </Link>
  );
};

/* ------------------------------------------------------------------ *
 * Badge / Chip
 * ------------------------------------------------------------------ */

export const Badge = ({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'coral' | 'good' | 'ink';
  className?: string;
}) => (
  <span className={`ee-badge ${tone === 'neutral' ? '' : `ee-badge-${tone}`} ${className}`.trim()}>
    {children}
  </span>
);

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */

export const Card = ({
  children,
  hover = false,
  ink = false,
  flush = false,
  className = '',
  style,
  ...rest
}: {
  children: ReactNode;
  hover?: boolean;
  ink?: boolean;
  flush?: boolean;
  className?: string;
  style?: CSSProperties;
} & HTMLAttributes<HTMLDivElement>) => (
  <div
    {...rest}
    className={[
      'ee-card',
      hover ? 'ee-card-hover' : '',
      ink ? 'ee-card-ink' : '',
      flush ? 'ee-card-flush' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    style={style}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ *
 * Form controls
 * ------------------------------------------------------------------ */

export const Field = ({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) => (
  <div className="ee-field">
    {label ? (
      <label className="ee-label" htmlFor={htmlFor}>
        {label}
      </label>
    ) : null}
    {children}
    {error ? <span className="ee-error">{error}</span> : null}
    {!error && hint ? <span className="ee-hint">{hint}</span> : null}
  </div>
);

export const TextInput = ({
  label,
  hint,
  error,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }) => (
  <Field label={label} hint={hint} error={error} htmlFor={rest.id}>
    <input className="ee-input" {...rest} />
  </Field>
);

export const TextArea = ({
  label,
  hint,
  error,
  rows = 4,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) => (
  <Field label={label} hint={hint} error={error} htmlFor={rest.id}>
    <textarea className="ee-textarea" rows={rows} {...rest} />
  </Field>
);

export const Select = ({
  label,
  hint,
  options,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  options: { value: string; label: string }[];
}) => (
  <Field label={label} hint={hint} htmlFor={rest.id}>
    <select className="ee-select" {...rest}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </Field>
);

export const Checkbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
}) => (
  <label className="ee-check">
    <input type="checkbox" checked={checked} onChange={(event) => { onChange(event.target.checked); }} />
    {label}
  </label>
);

export const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
}) => (
  <button
    type="button"
    className="ee-row ee-row-sm"
    style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
    onClick={() => { onChange(!checked); }}
    aria-pressed={checked}
  >
    <span className="ee-switch" data-on={checked ? 'true' : 'false'} />
    {label ? <span style={{ fontSize: '0.86rem' }}>{label}</span> : null}
  </button>
);

/* ------------------------------------------------------------------ *
 * IconButton / Empty / Section heading
 * ------------------------------------------------------------------ */

export const IconButton = ({
  onClick,
  label,
  icon,
  variant = 'default',
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  icon: ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}) => (
  <button
    type="button"
    className="ee-icon-btn"
    onClick={onClick}
    aria-label={label}
    title={label}
    data-variant={variant}
    disabled={disabled}
  >
    {icon}
  </button>
);

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="ee-empty">{children}</div>
);

export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  description,
  align = 'left',
  className = '',
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) => {
  const body = subtitle ?? description;

  if (!eyebrow && !title && !body) {
    return null;
  }
  return (
    <div
      className={`ee-stack ee-stack-sm ${align === 'center' ? 'ee-center' : ''} ${className}`.trim()}
      style={align === 'center' ? { alignItems: 'center', maxWidth: 720, marginInline: 'auto' } : undefined}
    >
      {eyebrow ? <span className="ee-eyebrow">{eyebrow}</span> : null}
      {title ? <h2 className="ee-h2">{title}</h2> : null}
      {body ? <p className="ee-lead">{body}</p> : null}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Modal
 * ------------------------------------------------------------------ */

export const Modal = ({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="ee-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="ee-modal"
        style={{ maxWidth: wide ? 780 : 620 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="ee-row ee-row-between" style={{ marginBottom: 16 }}>
          <h3 className="ee-h3" style={{ margin: 0 }}>
            {title}
          </h3>
          <IconButton onClick={onClose} label="Close" icon={<LuX size={15} />} />
        </div>
        {children}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Collapsible editor row (used across every admin collection)
 * ------------------------------------------------------------------ */

export const CollapsibleRow = ({
  title,
  meta,
  children,
  onDelete,
  onToggleVisibility,
  visible = true,
  defaultOpen = false,
  dragHandle,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
  onDelete?: () => void;
  onToggleVisibility?: (next: boolean) => void;
  visible?: boolean;
  defaultOpen?: boolean;
  dragHandle?: ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="ee-list-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className="ee-row ee-row-between" style={{ gap: 10, flexWrap: 'nowrap' }}>
        <div className="ee-row ee-row-sm" style={{ minWidth: 0, flex: 1 }}>
          {dragHandle}
          <button
            type="button"
            onClick={() => { setOpen((prev) => !prev); }}
            className="ee-row ee-row-xs"
            style={{
              background: 'none',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              minWidth: 0,
              flex: 1,
            }}
            aria-expanded={open}
          >
            <LuPencil size={14} className="ee-faint" />
            <span className="ee-truncate" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
              {title || 'Untitled'}
            </span>
            {meta ? <span className="ee-faint" style={{ fontSize: '0.76rem' }}>· {meta}</span> : null}
            {open ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
          </button>
        </div>
        <div className="ee-row ee-row-xs">
          {onToggleVisibility ? (
            <IconButton
              label={visible ? 'Hide from site' : 'Show on site'}
              icon={visible ? <LuCheck size={14} /> : <LuX size={14} />}
              onClick={() => { onToggleVisibility(!visible); }}
            />
          ) : null}
          {onDelete ? (
            <IconButton
              label="Delete"
              icon={<LuTrash2 size={14} />}
              variant="danger"
              onClick={onDelete}
            />
          ) : null}
        </div>
      </div>
      {open ? (
        <div className="ee-stack ee-stack-sm" style={{ marginTop: 14 }}>
          {children}
        </div>
      ) : null}
    </div>
  );
};

export const AddButton = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <Button variant="secondary" size="sm" icon={<LuPlus size={14} />} onClick={onClick}>
    {label}
  </Button>
);

/* ------------------------------------------------------------------ *
 * Toast
 * ------------------------------------------------------------------ */

export const Toast = ({
  message,
  tone = 'info',
  onDone,
}: {
  message: string;
  tone?: 'info' | 'success' | 'error';
  onDone: () => void;
}) => {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 3200);
    return () => { window.clearTimeout(timer); };
  }, [message, onDone]);

  const accent =
    tone === 'success' ? '#35c98d' : tone === 'error' ? '#ff6b5e' : 'var(--ee-accent-ink)';

  return (
    <div className="ee-toast" role="status">
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: accent,
          flexShrink: 0,
        }}
      />
      <span>{message}</span>
    </div>
  );
};
