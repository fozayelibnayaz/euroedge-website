import type { CSSProperties, ReactNode } from 'react';

/**
 * The Framer 1px structural rail system.
 *
 * One implementation of the frame, the crosshairs and the laser runner, reused
 * by every section and by the Raycast surfaces. Nothing re-declares this markup.
 */

export const RailFrame = ({
  children,
  wide = false,
  className = '',
  style,
}: {
  children: ReactNode;
  wide?: boolean;
  className?: string;
  style?: CSSProperties;
}) => (
  <div className={`ee-container ${wide ? 'ee-container-wide' : ''} ${className}`.trim()} style={style}>
    <span className="ee-crosshair" data-corner="tl" aria-hidden="true" />
    <span className="ee-crosshair" data-corner="tr" aria-hidden="true" />
    <span className="ee-crosshair" data-corner="bl" aria-hidden="true" />
    <span className="ee-crosshair" data-corner="br" aria-hidden="true" />
    {children}
  </div>
);

/** Continuous 1px vertical rail that runs the height of a column of rows. */
export const RailColumn = ({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <div className={`ee-rail-col ${className}`.trim()} style={style}>
    {children}
  </div>
);

/** A single hairline index row: 1px top rule, index gutter, content, meta. */
export const RailRow = ({
  index,
  children,
  active = false,
  onSelect,
  ariaLabel,
  id,
}: {
  index?: string;
  children: ReactNode;
  active?: boolean;
  onSelect?: () => void;
  ariaLabel?: string;
  id?: string;
}) => {
  const interactive = typeof onSelect === 'function';

  return (
    <div
      id={id}
      className="ee-rail-row"
      data-active={active ? 'true' : 'false'}
      data-interactive={interactive ? 'true' : 'false'}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? active : undefined}
      aria-label={ariaLabel}
      onClick={onSelect}
      onKeyDown={
        interactive
          ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect?.();
            }
          }
          : undefined
      }
    >
      {index ? <span className="ee-rail-row-index ee-mono">{index}</span> : null}
      <span className="ee-rail-row-body">{children}</span>
    </div>
  );
};

/** Full-bleed 1px horizontal divider used between structural bands. */
export const HairlineDivider = ({ label }: { label?: string }) =>
  label ? (
    <div className="ee-hairline ee-hairline-labelled">
      <span className="ee-mono">{label}</span>
    </div>
  ) : (
    <div className="ee-hairline" aria-hidden="true" />
  );
