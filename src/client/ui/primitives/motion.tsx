import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  motion,
  useInView as useFramerInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';

/* ------------------------------------------------------------------ *
 * useInView — one observer implementation reused by every animation
 * ------------------------------------------------------------------ */

export const useInView = (
  options: { once?: boolean; amount?: number; rootMargin?: string } = {}
): [React.RefObject<HTMLDivElement | null>, boolean] => {
  const { once = true, amount = 0.18, rootMargin = '0px 0px -8% 0px' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        if (entry.isIntersecting) {
          setInView(true);
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: amount, rootMargin }
    );

    observer.observe(node);
    return () => { observer.disconnect(); };
  }, [once, amount, rootMargin]);

  return [ref, inView];
};

/* ------------------------------------------------------------------ *
 * Reveal — scroll-triggered entrance. Variants are pure CSS classes.
 * ------------------------------------------------------------------ */

type RevealVariant = 'up' | 'scale' | 'mask' | 'left' | 'right';

const variantClass: Record<RevealVariant, string> = {
  up: 'ee-reveal',
  scale: 'ee-reveal ee-reveal-scale',
  mask: 'ee-reveal-mask',
  left: 'ee-reveal',
  right: 'ee-reveal',
};

const variantStyle: Record<RevealVariant, CSSProperties> = {
  up: {},
  scale: {},
  mask: {},
  left: { transform: 'translate3d(-28px, 0, 0)' },
  right: { transform: 'translate3d(28px, 0, 0)' },
};

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: 'div' | 'span' | 'li' | 'section' | 'header' | 'article';
  style?: CSSProperties;
}

export const Reveal = ({
  children,
  variant = 'up',
  delay = 0,
  className = '',
  as = 'div',
  style,
}: RevealProps) => {
  const [ref, inView] = useInView();
  const Tag = as as 'div';
  const shown = inView ? 'true' : 'false';
  const delayStyle = { ['--ee-delay' as string]: `${String(delay)}ms` };

  // The mask variant hides itself with clip-path, which zeroes its own
  // intersection area — the observer can never reach the threshold, so the
  // element would stay clipped forever. Observe an unclipped wrapper and clip
  // an inner element instead.
  if (variant === 'mask') {
    return (
      <Tag
        ref={ref}
        className={className}
        data-shown={shown}
        style={{ ...delayStyle, ...style }}
      >
        <span className={variantClass.mask} data-shown={shown} style={delayStyle}>
          {children}
        </span>
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={`${variantClass[variant]} ${className}`.trim()}
      data-shown={shown}
      style={{
        ...variantStyle[variant],
        ...(inView ? { transform: 'none' } : {}),
        ...delayStyle,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

/* ------------------------------------------------------------------ *
 * Parallax — depth tied to scroll position
 * ------------------------------------------------------------------ */

interface ParallaxProps {
  children: ReactNode;
  distance?: number;
  className?: string;
  style?: CSSProperties;
}

export const Parallax = ({ children, distance = 60, className = '', style }: ParallaxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const smooth = useSpring(y, { stiffness: 90, damping: 22, mass: 0.4 });

  return (
    <motion.div ref={ref} style={{ y: smooth, ...style }} className={className}>
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * Tilt — pointer-driven 3D rotation for cards and panels
 * ------------------------------------------------------------------ */

interface TiltProps {
  children: ReactNode;
  max?: number;
  className?: string;
  style?: CSSProperties;
}

export const Tilt = ({ children, max = 8, className = '', style }: TiltProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 160,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 160,
    damping: 18,
  });

  return (
    <motion.div
      ref={ref}
      className={`ee-tilt ${className}`.trim()}
      style={{ rotateX, rotateY, transformPerspective: 900, ...style }}
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        px.set((event.clientX - rect.left) / rect.width);
        py.set((event.clientY - rect.top) / rect.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * Magnetic — element leans toward the cursor
 * ------------------------------------------------------------------ */

interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export const Magnetic = ({ children, strength = 14, className = '' }: MagneticProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 200, damping: 16 });
  const y = useSpring(my, { stiffness: 200, damping: 16 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y, display: 'inline-flex' }}
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        mx.set(((event.clientX - rect.left) / rect.width - 0.5) * strength * 2);
        my.set(((event.clientY - rect.top) / rect.height - 0.5) * strength * 2);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ *
 * CountUp — animates a numeric string when it enters the viewport
 * ------------------------------------------------------------------ */

interface CountUpProps {
  value: string;
  duration?: number;
  className?: string;
}

const SPLIT = /([0-9]+(?:[.,][0-9]+)*)/g;

export const CountUp = ({ value, duration = 1400, className = '' }: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useFramerInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(value);

  const parts = useMemo(() => value.split(SPLIT).filter((part) => part !== ''), [value]);
  const numbers = useMemo(
    () => parts.filter((part) => /[0-9]/.test(part)).map((part) => Number(part.replace(/,/g, ''))),
    [parts]
  );

  useEffect(() => {
    if (!inView || numbers.length === 0) {
      return undefined;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      let index = 0;
      const rendered = parts
        .map((part) => {
          if (!/[0-9]/.test(part)) {
            return part;
          }
          const target = numbers[index] ?? 0;
          index += 1;
          return String(Math.round(target * eased));
        })
        .join('');
      setDisplay(rendered);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); };
  }, [inView, numbers, parts, duration, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};

/* ------------------------------------------------------------------ *
 * Marquee — infinite loop that pauses on hover
 * ------------------------------------------------------------------ */

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export const Marquee = ({ children, speed = 44, className = '' }: MarqueeProps) => (
  <div className={`ee-marquee-track ${className}`.trim()}>
    <div className="ee-marquee" style={{ ['--ee-marquee-speed' as string]: `${String(speed)}s` }}>
      <div className="ee-row ee-row-md" style={{ paddingRight: 24 }}>
        {children}
      </div>
      <div className="ee-row ee-row-md" style={{ paddingRight: 24 }} aria-hidden="true">
        {children}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ *
 * Scramble — text resolves character by character on view
 * ------------------------------------------------------------------ */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#$%&*';

interface ScrambleProps {
  text: string;
  className?: string;
  speed?: number;
}

export const Scramble = ({ text, className = '', speed = 34 }: ScrambleProps) => {
  const [output, setOutput] = useState(text);

  useEffect(() => {
    let frame = 0;
    let iteration = 0;
    let revealed = 0;

    const tick = () => {
      iteration += 1;
      if (iteration % 2 !== 0) {
        frame = requestAnimationFrame(tick);
        return;
      }

      revealed = Math.min(text.length, Math.floor(iteration / 2));
      const next = text
        .split('')
        .map((char, index) => {
          if (char === ' ') {
            return ' ';
          }
          if (index < revealed) {
            return char;
          }
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? char;
        })
        .join('');

      setOutput(next);

      if (revealed < text.length) {
        frame = requestAnimationFrame(tick);
      } else {
        setOutput(text);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); };
  }, [text, speed]);

  return <span className={className}>{output}</span>;
};

/* ------------------------------------------------------------------ *
 * Spotlight — cursor-following glow on a card
 * ------------------------------------------------------------------ */

interface SpotlightProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Spotlight = ({ children, className = '', style }: SpotlightProps) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`ee-spotlight ${className}`.trim()}
      style={style}
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        ref.current?.style.setProperty('--ee-mx', `${String(event.clientX - rect.left)}px`);
        ref.current?.style.setProperty('--ee-my', `${String(event.clientY - rect.top)}px`);
      }}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * ProgressOnScroll — 1px line that fills as the page scrolls
 * ------------------------------------------------------------------ */

export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });

  return (
    <motion.div
      style={{
        scaleX,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        transformOrigin: '0% 50%',
        background: 'linear-gradient(90deg, var(--ee-accent), var(--ee-coral))',
        zIndex: 120,
      }}
      aria-hidden="true"
    />
  );
};

export type { MotionValue };
