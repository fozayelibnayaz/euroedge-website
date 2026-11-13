import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { LuPause, LuPlay } from 'react-icons/lu';

/* ------------------------------------------------------------------ *
 * SmartImage — real image with a designed offline plate as fallback.
 * Keeps the site looking intentional when an external image is blocked
 * or has not been uploaded yet.
 * ------------------------------------------------------------------ */

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const PALETTES: [string, string, string][] = [
  ['#4c7dff', '#7c9bff', '#0f1420'],
  ['#2ec5c0', '#5fe0dc', '#0d1618'],
  ['#a78bfa', '#c4b5fd', '#120f1c'],
  ['#f0b429', '#fbcc5c', '#161208'],
  ['#ff5a3c', '#ff8a72', '#170d0a'],
  ['#38bdf8', '#7dd3fc', '#0b1418'],
];

export const ImagePlate = ({
  label = 'EuroEdge',
  seed = '',
  className = '',
  style,
}: {
  label?: string;
  seed?: string;
  className?: string;
  style?: CSSProperties;
}) => {
  const [ink, mid, paper] = useMemo(
    () => PALETTES[hashString(seed || label) % PALETTES.length] ?? PALETTES[0],
    [seed, label]
  );
  const initials = useMemo(
    () =>
      label
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('') || 'EE',
    [label]
  );

  return (
    <svg
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`pl-${hashString(seed + label)}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={paper} />
          <stop offset="100%" stopColor={mid} stopOpacity="0.28" />
        </linearGradient>
        <pattern id={`pt-${hashString(seed + label)}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.1" fill={ink} opacity="0.18" />
        </pattern>
      </defs>
      <rect width="400" height="250" fill={`url(#pl-${hashString(seed + label)})`} />
      <rect width="400" height="250" fill={`url(#pt-${hashString(seed + label)})`} />
      <circle cx="330" cy="52" r="58" fill={ink} opacity="0.22" />
      <circle cx="72" cy="214" r="46" fill={mid} opacity="0.26" />
      <text
        x="26"
        y="222"
        fontSize="52"
        fontWeight="700"
        fontFamily="Space Grotesk, system-ui, sans-serif"
        fill={ink}
        opacity="0.42"
      >
        {initials}
      </text>
      <path d="M0 196 L96 150 L188 178 L286 116 L400 152 L400 250 L0 250 Z" fill={ink} opacity="0.2" />
    </svg>
  );
};

interface SmartImageProps {
  src: string;
  alt: string;
  seed?: string;
  className?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
}

export const SmartImage = ({
  src,
  alt,
  seed,
  className = '',
  style,
  loading = 'lazy',
}: SmartImageProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <ImagePlate label={alt} seed={seed ?? src} className={className} style={style} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      style={style}
      onError={() => { setFailed(true); }}
    />
  );
};

/* ------------------------------------------------------------------ *
 * Showreel — SVG motion scenes that play and pause like a video loop.
 * ------------------------------------------------------------------ */

type SceneKey = 'campus' | 'classroom' | 'visa';

const CampusScene = () => (
  <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-label="Campus film">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--ee-scene-deep)" />
        <stop offset="60%" stopColor="var(--ee-scene-sky)" />
        <stop offset="100%" stopColor="var(--ee-scene-sky-hi)" />
      </linearGradient>
      <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--ee-accent)" />
        <stop offset="100%" stopColor="var(--ee-coral)" />
      </linearGradient>
    </defs>

    <rect width="800" height="450" fill="url(#sky)" />

    <g opacity="0.5">
      {Array.from({ length: 46 }).map((_, index) => (
        <circle
          key={`star-${String(index)}`}
          cx={(index * 137) % 800}
          cy={(index * 61) % 220}
          r={index % 7 === 0 ? 1.8 : 1}
          fill="var(--ee-scene-ink-hi)"
        >
          <animate
            attributeName="opacity"
            values="0.15;0.9;0.15"
            dur={`${String(2 + (index % 5))}s`}
            repeatCount="indefinite"
            begin={`${String((index % 10) * 0.3)}s`}
          />
        </circle>
      ))}
    </g>

    {/* Sun / moon arc */}
    <circle cx="640" cy="118" r="34" fill="var(--ee-scene-sun)" opacity="0.85">
      <animate attributeName="cy" values="140;96;140" dur="14s" repeatCount="indefinite" />
    </circle>

    {/* Clouds */}
    {[0, 1, 2].map((cloud) => (
      <g key={`cloud-${String(cloud)}`} opacity="0.16">
        <ellipse cx="0" cy="0" rx="70" ry="18" fill="var(--ee-scene-ink-hi)" />
        <ellipse cx="54" cy="8" rx="46" ry="13" fill="var(--ee-scene-ink-hi)" />
        <animateTransform
          attributeName="transform"
          type="translate"
          from="-140 0"
          to="940 0"
          dur={`${String(34 + cloud * 12)}s`}
          repeatCount="indefinite"
          begin={`${String(cloud * -8)}s`}
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          additive="sum"
          values="0 0;0 -8;0 0"
          dur="12s"
          repeatCount="indefinite"
        />
      </g>
    ))}

    {/* Skyline */}
    <g>
      {[
        { x: 40, w: 92, h: 190 },
        { x: 148, w: 68, h: 246 },
        { x: 232, w: 116, h: 148 },
        { x: 364, w: 78, h: 274 },
        { x: 458, w: 128, h: 176 },
        { x: 602, w: 72, h: 232 },
        { x: 690, w: 84, h: 156 },
      ].map((building, index) => (
        <g key={`b-${String(index)}`}>
          <rect
            x={building.x}
            y={340 - building.h}
            width={building.w}
            height={building.h}
            fill="var(--ee-scene-void)"
            stroke="var(--ee-scene-mid)"
            strokeWidth="1"
          />
          {Array.from({ length: Math.floor(building.h / 26) }).map((_, row) =>
            Array.from({ length: Math.floor(building.w / 24) }).map((__, col) => (
              <rect
                key={`w-${String(index)}-${String(row)}-${String(col)}`}
                x={building.x + 10 + col * 24}
                y={340 - building.h + 14 + row * 26}
                width="9"
                height="13"
                fill="var(--ee-scene-sun)"
                opacity="0.12"
              >
                <animate
                  attributeName="opacity"
                  values="0.12;0.92;0.12"
                  dur={`${String(5 + ((index + row + col) % 6))}s`}
                  repeatCount="indefinite"
                  begin={`${String(((index * 3 + row * 2 + col) % 9) * 0.45)}s`}
                />
              </rect>
            ))
          )}
        </g>
      ))}
    </g>

    {/* Ground */}
    <rect x="0" y="340" width="800" height="110" fill="var(--ee-scene-void)" />
    <path d="M0 340 H800" stroke="var(--ee-scene-line)" strokeWidth="1" />

    {/* Walking students */}
    {[0, 1, 2, 3].map((walker) => (
      <g key={`walker-${String(walker)}`} opacity="0.9">
        <circle cx="0" cy="-30" r="7" fill="var(--ee-scene-ink)" />
        <rect x="-5" y="-22" width="10" height="24" rx="4" fill="var(--ee-scene-ink)" />
        <animateTransform
          attributeName="transform"
          type="translate"
          from={`${String(-40 + walker * 60)} ${String(386 + walker * 9)}`}
          to={`${String(860 + walker * 60)} ${String(386 + walker * 9)}`}
          dur={`${String(26 + walker * 5)}s`}
          repeatCount="indefinite"
          begin={`${String(walker * -6)}s`}
        />
      </g>
    ))}

    {/* Plane tracing a route */}
    <path
      d="M-60 96 C 180 40, 420 150, 900 62"
      fill="none"
      stroke="url(#glow)"
      strokeWidth="1.4"
      strokeDasharray="6 10"
      opacity="0.85"
    >
      <animate attributeName="stroke-dashoffset" from="0" to="-320" dur="9s" repeatCount="indefinite" />
    </path>
    <g>
      <path d="M0 0 l14 5 l-14 5 l4 -5 z" fill="var(--ee-scene-sun-warm)" />
      <animateMotion dur="11s" repeatCount="indefinite" path="M-60 96 C 180 40, 420 150, 900 62" />
    </g>
  </svg>
);

const ClassroomScene = () => (
  <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-label="Classroom film">
    <rect width="800" height="450" fill="var(--ee-scene-deep)" />

    {/* Board */}
    <rect x="70" y="46" width="420" height="252" rx="10" fill="var(--ee-scene-solid)" stroke="var(--ee-scene-line)" />
    <text x="96" y="96" fontSize="20" fontFamily="Space Grotesk, sans-serif" fill="var(--ee-scene-ink)">
      Band 7 = control, not
    </text>
    <text x="96" y="132" fontSize="20" fontFamily="Space Grotesk, sans-serif" fill="var(--ee-scene-sun-warm)">
      complicated vocabulary.
    </text>

    {[
      { y: 178, w: 300, d: 1.2 },
      { y: 204, w: 250, d: 2.4 },
      { y: 230, w: 320, d: 3.6 },
      { y: 256, w: 210, d: 4.8 },
    ].map((line) => (
      <g key={`line-${String(line.y)}`}>
        <rect x="96" y={line.y} width="0" height="7" rx="3" fill="var(--ee-accent)" opacity="0.5">
          <animate
            attributeName="width"
            values={`0;${String(line.w)};${String(line.w)}`}
            dur="6s"
            begin={`${String(line.d)}s`}
            repeatCount="indefinite"
            keyTimes="0;0.5;1"
          />
        </rect>
      </g>
    ))}

    {/* Pointer */}
    <g>
      <circle cx="0" cy="0" r="6" fill="var(--ee-coral)" />
      <circle cx="0" cy="0" r="6" fill="none" stroke="var(--ee-coral)" strokeWidth="1.5" opacity="0.6">
        <animate attributeName="r" values="6;22" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <animateTransform
        attributeName="transform"
        type="translate"
        values="110 168; 390 168; 140 246; 380 246; 110 168"
        dur="9s"
        repeatCount="indefinite"
      />
    </g>

    {/* Voice waveform */}
    <g transform="translate(560 300)">
      {Array.from({ length: 26 }).map((_, index) => (
        <rect
          key={`bar-${String(index)}`}
          x={index * 8}
          y={-30}
          width="4"
          height="60"
          rx="2"
          fill={index % 5 === 0 ? 'var(--ee-coral)' : 'var(--ee-accent)'}
        >
          <animate
            attributeName="height"
            values="12;60;22;48;12"
            dur={`${String(1.1 + (index % 6) * 0.16)}s`}
            repeatCount="indefinite"
            begin={`${String(index * 0.05)}s`}
          />
          <animate
            attributeName="y"
            values="-6;-30;-11;-24;-6"
            dur={`${String(1.1 + (index % 6) * 0.16)}s`}
            repeatCount="indefinite"
            begin={`${String(index * 0.05)}s`}
          />
        </rect>
      ))}
    </g>

    {/* Floating word chips */}
    {['coherence', 'register', 'paraphrase', 'timing', 'accuracy'].map((word, index) => (
      <g key={word}>
        <rect
          x={560}
          y={70 + index * 34}
          width={word.length * 8 + 26}
          height="26"
          rx="13"
          fill="var(--ee-scene-solid)"
          stroke="var(--ee-scene-line)"
        />
        <text
          x={572}
          y={88 + index * 34}
          fontSize="12"
          fontFamily="JetBrains Mono, monospace"
          fill="var(--ee-scene-ink)"
        >
          {word}
        </text>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; -8 -4; 0 0"
          dur={`${String(5 + index)}s`}
          repeatCount="indefinite"
        />
      </g>
    ))}

    {/* Progress ring */}
    <g transform="translate(700 92)">
      <circle r="30" fill="none" stroke="var(--ee-scene-line)" strokeWidth="5" />
      <circle
        r="30"
        fill="none"
        stroke="var(--ee-accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="188"
        transform="rotate(-90)"
      >
        <animate attributeName="stroke-dashoffset" values="188;40;188" dur="7s" repeatCount="indefinite" />
      </circle>
      <text
        y="5"
        textAnchor="middle"
        fontSize="14"
        fontFamily="JetBrains Mono, monospace"
        fill="var(--ee-scene-ink-hi)"
      >
        7.0
      </text>
    </g>

    <rect x="0" y="392" width="800" height="58" fill="var(--ee-scene-void)" />
    {Array.from({ length: 8 }).map((_, index) => (
      <g key={`desk-${String(index)}`}>
        <rect x={30 + index * 96} y="404" width="66" height="34" rx="6" fill="var(--ee-scene-mid)" stroke="var(--ee-scene-line)" />
        <circle cx={63 + index * 96} cy="398" r="9" fill="var(--ee-scene-mid)" />
      </g>
    ))}
  </svg>
);

const VisaScene = () => (
  <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-label="Visa filing film">
    <rect width="800" height="450" fill="var(--ee-scene-deep)" />

    {/* Dotted world map */}
    <g fill="var(--ee-scene-line)">
      {Array.from({ length: 420 }).map((_, index) => {
        const col = index % 42;
        const row = Math.floor(index / 42);
        const x = 60 + col * 16;
        const y = 60 + row * 14;
        const inLandmass =
          (row > 2 && row < 6 && col > 4 && col < 14) ||
          (row > 5 && row < 11 && col > 8 && col < 18) ||
          (row > 1 && row < 5 && col > 20 && col < 30) ||
          (row > 4 && row < 12 && col > 24 && col < 33) ||
          (row > 8 && row < 12 && col > 30 && col < 40);
        if (!inLandmass) {
          return null;
        }
        return <circle key={`dot-${String(index)}`} cx={x} cy={y} r="1.6" />;
      })}
    </g>

    {/* Route arcs */}
    {[
      { d: 'M600 132 C 460 90, 320 150, 168 122', c: 'var(--ee-accent)', dur: '4s' },
      { d: 'M612 150 C 470 190, 340 130, 176 168', c: 'var(--ee-teal)', dur: '5s' },
      { d: 'M596 168 C 450 240, 300 210, 160 208', c: 'var(--ee-coral)', dur: '6s' },
    ].map((route, index) => (
      <g key={`route-${String(index)}`}>
        <path d={route.d} fill="none" stroke={route.c} strokeWidth="1.6" strokeDasharray="420" opacity="0.9">
          <animate
            attributeName="stroke-dashoffset"
            values="420;0;0"
            dur={route.dur}
            repeatCount="indefinite"
            keyTimes="0;0.6;1"
          />
        </path>
        <circle r="4" fill={route.c}>
          <animateMotion dur={route.dur} repeatCount="indefinite" path={route.d} keyPoints="0;1" keyTimes="0;1" />
        </circle>
      </g>
    ))}

    {/* Document stack */}
    <g transform="translate(80 268)">
      {[0, 1, 2, 3].map((sheet) => (
        <g key={`sheet-${String(sheet)}`}>
          <rect
            x={sheet * 6}
            y={sheet * -8}
            width="150"
            height="104"
            rx="6"
            fill="var(--ee-scene-solid)"
            stroke="var(--ee-scene-line)"
          />
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0 0; 0 ${String(-6 - sheet * 3)}; 0 0`}
            dur={`${String(4 + sheet)}s`}
            repeatCount="indefinite"
          />
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((line) => (
        <rect key={`l-${String(line)}`} x="22" y={26 + line * 16} width={96 - line * 12} height="5" rx="2" fill="var(--ee-scene-mid)">
          <animate
            attributeName="width"
            values={`0;${String(96 - line * 12)}`}
            dur="2.6s"
            begin={`${String(line * 0.28)}s`}
            repeatCount="indefinite"
          />
        </rect>
      ))}
    </g>

    {/* Approval stamp */}
    <g transform="translate(300 300)">
      <g opacity="0">
        <circle r="62" fill="none" stroke="var(--ee-good)" strokeWidth="4" />
        <circle r="52" fill="none" stroke="var(--ee-good)" strokeWidth="1.5" />
        <text
          y="-6"
          textAnchor="middle"
          fontSize="18"
          fontFamily="Space Grotesk, sans-serif"
          fontWeight="700"
          fill="var(--ee-good)"
        >
          APPROVED
        </text>
        <text y="18" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="var(--ee-good)">
          28-DAY RULE PASS
        </text>
        <animate
          attributeName="opacity"
          values="0;0;1;1;0"
          keyTimes="0;0.55;0.66;0.9;1"
          dur="9s"
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1.6;1.6;1;1;1.6"
          keyTimes="0;0.55;0.68;0.9;1"
          dur="9s"
          repeatCount="indefinite"
          additive="sum"
        />
      </g>
    </g>

    {/* Checklist */}
    <g transform="translate(560 268)">
      {['Passport', 'CAS / I-20', 'Bank 28 days', 'TB certificate', 'Biometrics'].map((item, index) => (
        <g key={item}>
          <circle cx="10" cy={26 + index * 34} r="9" fill="none" stroke="var(--ee-scene-line)" />
          <path
            d={`M6 ${26 + index * 34} l3 3 l6 -7`}
            fill="none"
            stroke="var(--ee-good)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="16"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="16;0"
              dur="1s"
              begin={`${String(index * 1.1)}s`}
              repeatCount="indefinite"
              keyTimes="0;1"
            />
            <animate
              attributeName="stroke-dashoffset"
              values="0;0"
              dur={`${String(7 - index * 1.1)}s`}
              begin={`${String(index * 1.1 + 1)}s`}
              repeatCount="indefinite"
            />
          </path>
          <text
            x="30"
            y={31 + index * 34}
            fontSize="13"
            fontFamily="JetBrains Mono, monospace"
            fill="var(--ee-scene-ink)"
          >
            {item}
          </text>
        </g>
      ))}
    </g>
  </svg>
);

const SCENES: Record<SceneKey, () => React.JSX.Element> = {
  campus: CampusScene,
  classroom: ClassroomScene,
  visa: VisaScene,
};

interface ShowreelProps {
  scene?: string;
  caption?: string;
  className?: string;
}

export const Showreel = ({ scene = 'campus', caption, className = '' }: ShowreelProps) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const key = (Object.keys(SCENES).includes(scene) ? scene : 'campus') as SceneKey;
  const Scene = SCENES[key];

  useEffect(() => {
    const node = svgRef.current?.querySelector('svg');
    if (!node) {
      return;
    }
    if (playing) {
      node.unpauseAnimations();
    } else {
      node.pauseAnimations();
    }
  }, [playing, key]);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setProgress(((now - started) / 14000) % 1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); };
  }, [playing]);

  return (
    <div className={`ee-reel ${className}`.trim()}>
      <div ref={svgRef} style={{ width: '100%', height: '100%' }}>
        <Scene />
      </div>
      <div className="ee-reel-bar" aria-hidden="true">
        <i style={{ width: `${String(progress * 100)}%` }} />
      </div>
      <button
        type="button"
        className="ee-reel-ctrl"
        onClick={() => { setPlaying((prev) => !prev); }}
        aria-label={playing ? 'Pause motion film' : 'Play motion film'}
      >
        {playing ? <LuPause size={14} /> : <LuPlay size={14} />}
      </button>
      {caption ? (
        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            fontFamily: 'var(--ee-font-mono)',
            fontSize: '0.68rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ee-scene-ink-hi)',
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};
