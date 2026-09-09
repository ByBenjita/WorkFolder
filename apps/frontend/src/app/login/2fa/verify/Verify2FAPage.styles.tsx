import type { CSSProperties } from 'react';
import type { Variants } from 'framer-motion';
import type { OrbitPhase } from './useVerify2FAOrbit';

/**
 * Capa de diseño de la verificación 2FA.
 *
 * A diferencia de los otros `*.styles.tsx` (que exportan un template de
 * styled-jsx), aquí se exportan objetos de estilo y variantes de Framer:
 * styled-jsx no aplica sus clases scoped sobre los componentes `motion.*`,
 * así que el layout de las casillas animadas debe ir inline.
 */

// ── Tokens ───────────────────────────────────────────────────
export const COLORS = {
  ice: '#dceaff',
  ok: '#2ee6a8',
  bad: '#ff4d6a',
  okInk: '#05261b',
} as const;

export const LAYOUT = {
  codeLength: 6,
  tileW: 40,
  tileH: 50,
  gap: 6,
  radius: 60, // radio de la órbita
  sparks: 11,
  orbitBoxW: 300,
  orbitBoxH: 188,
  ringSize: 188,
} as const;

// Curvas: "amaga y frena", entrada lenta y rebote
export const EASE = {
  windUpBrake: [0.66, -0.35, 0.3, 1] as [number, number, number, number],
  slowIn: [0.5, 0, 0.75, 0] as [number, number, number, number],
  pop: [0.34, 1.62, 0.58, 1] as [number, number, number, number],
};

// ── Geometría ────────────────────────────────────────────────
const N = LAYOUT.codeLength;
const STEP = LAYOUT.tileW + LAYOUT.gap;
const rad = (d: number) => (d * Math.PI) / 180;

/** Centro de la casilla `i` en la fila, relativo al centro del grupo. */
export const rowX = (i: number) => (i - (N - 1) / 2) * STEP;
const ang = (i: number) => rad(-90 + i * (360 / N));
/** Desplazamiento desde la fila hasta el punto de la órbita. */
export const toOrbitX = (i: number) => Math.cos(ang(i)) * LAYOUT.radius - rowX(i);
export const toOrbitY = (i: number) => Math.sin(ang(i)) * LAYOUT.radius;

/** Posición/tiempo de cada chispa del "verificado". */
export const spark = (k: number) => {
  const a = rad((360 / LAYOUT.sparks) * k - 90);
  const d = 44 + (k % 3) * 9;
  return {
    to: { x: Math.cos(a) * d, y: Math.sin(a) * d },
    delay: 0.12 + k * 0.018,
  };
};

// ── Variantes de Framer ──────────────────────────────────────
const springTile = { type: 'spring', stiffness: 260, damping: 26 } as const;

export const groupVariants: Variants = {
  input: { rotate: 0, x: 0 },
  orbit: { rotate: 0, x: 0 },
  spin: { rotate: 450, x: 0, transition: { duration: 0.95, ease: EASE.windUpBrake } },
  screw: { rotate: 450, x: 0, transition: { duration: 0.5 } },
  verified: { rotate: 450, x: 0 },
  error: {
    rotate: 0,
    x: [0, -13, 12, -9, 7, -4, 0],
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const tileVariants: Variants = {
  input: {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: '#2a2a2a',
    color: '#ffffff',
    transition: springTile,
  },
  orbit: (i: number) => ({
    x: toOrbitX(i),
    y: toOrbitY(i),
    rotate: 0,
    scale: 0.92,
    opacity: 1,
    backgroundColor: '#f3f6ff',
    borderColor: '#f3f6ff',
    color: '#0b1220',
    transition: { type: 'spring', stiffness: 210, damping: 21, delay: 0.035 * i },
  }),
  spin: (i: number) => ({
    x: toOrbitX(i),
    y: toOrbitY(i),
    rotate: -450,
    scale: 0.92,
    opacity: 1,
    backgroundColor: '#0c221b',
    borderColor: COLORS.ok,
    color: COLORS.ok,
    transition: {
      rotate: { duration: 0.95, ease: EASE.windUpBrake },
      default: { duration: 0.45, delay: 0.4 },
    },
  }),
  screw: (i: number) => ({
    x: -rowX(i),
    y: 0,
    rotate: -540,
    scale: 0.22,
    opacity: 0,
    transition: { duration: 0.5, ease: EASE.slowIn },
  }),
  verified: { opacity: 0, transition: { duration: 0.1 } },
  error: {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    backgroundColor: 'rgba(255,77,106,0.12)',
    borderColor: COLORS.bad,
    color: '#ffffff',
    transition: springTile,
  },
};

// ── Motion configs de los bloques que se cruzan ──────────────
export const headSwapMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25 },
};

export const actionDoneMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, delay: 0.1 },
};

export const actionFormMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const noticeMotion = {
  initial: { opacity: 0, height: 0, marginBottom: 0 },
  animate: { opacity: 1, height: 'auto', marginBottom: 12 },
  exit: { opacity: 0, height: 0, marginBottom: 0 },
  transition: { duration: 0.2 },
};

// Aviso de "Código inválido": entra con un pequeño golpe lateral
export const invalidNoticeMotion = {
  initial: { opacity: 0, y: -6, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, x: [0, -4, 4, -3, 2, 0] },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
  transition: { duration: 0.42, ease: 'easeOut' as const },
};

export const verdictTileMotion = {
  initial: { opacity: 0, scale: 0.2, rotate: -45 },
  hidden: { opacity: 0, scale: 0.2, rotate: -45 },
  shown: { opacity: 1, scale: 1, rotate: 0 },
};

export const verdictTransition = (phase: OrbitPhase) => ({
  duration: 0.5,
  ease: EASE.pop,
  delay: phase === 'screw' ? 0.12 : 0,
});

// ── Estilos estáticos ────────────────────────────────────────
export const S = {
  main: {
    minHeight: '100vh',
    backgroundImage:
      'linear-gradient(rgba(0,0,0,0.88), rgba(0,0,0,0.88)), url(/background.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Segoe UI", system-ui, sans-serif',
  } as CSSProperties,

  card: {
    width: '100%',
    maxWidth: '360px',
    padding: '32px 28px',
    backgroundColor: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: '32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
    textAlign: 'center',
    overflow: 'hidden',
  } as CSSProperties,

  subtitle: {
    color: '#4a5568',
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 16,
  } as CSSProperties,

  orbitBox: {
    position: 'relative',
    width: LAYOUT.orbitBoxW,
    maxWidth: '100%',
    height: LAYOUT.orbitBoxH,
    margin: '4px auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  verdictTile: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 56,
    height: 56,
    marginLeft: -28,
    marginTop: -28,
    borderRadius: 15,
    background: COLORS.ok,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.okInk,
    boxShadow: '0 0 30px 6px rgba(46,230,168,0.5)',
    pointerEvents: 'none',
  } as CSSProperties,

  spark: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 4,
    height: 4,
    marginLeft: -2,
    marginTop: -2,
    borderRadius: '50%',
    background: COLORS.ok,
    pointerEvents: 'none',
  } as CSSProperties,

  digitGroup: {
    display: 'flex',
    gap: LAYOUT.gap,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  } as CSSProperties,

  digitTile: {
    width: LAYOUT.tileW,
    height: LAYOUT.tileH,
    flex: '0 0 auto',
    borderRadius: 9,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  notice: {
    color: COLORS.bad,
    fontSize: 11,
    fontWeight: 600,
    overflow: 'hidden',
  } as CSSProperties,

  noticeInvalid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: COLORS.bad,
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: '0.2px',
    marginBottom: 12,
  } as CSSProperties,

  secureLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: COLORS.ok,
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 16,
  } as CSSProperties,

  footer: {
    color: '#2d3748',
    fontSize: 11,
    marginTop: 20,
    fontWeight: 600,
  } as CSSProperties,
} as const;

// ── Estilos que dependen de la fase ──────────────────────────
export const iconBox = (isDone: boolean): CSSProperties => ({
  width: 56,
  height: 56,
  borderRadius: '16px',
  background: isDone
    ? 'linear-gradient(135deg, #2ee6a822, #2ee6a844)'
    : 'linear-gradient(135deg, #dceaff22, #dceaff44)',
  border: `1px solid ${isDone ? '#2ee6a866' : '#dceaff44'}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 18px',
  fontSize: 24,
  transition: 'background .4s ease, border-color .4s ease',
});

export const heading = (isDone: boolean): CSSProperties => ({
  color: isDone ? COLORS.ok : '#fff',
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 8,
});

const isVerdict = (p: OrbitPhase) => p === 'screw' || p === 'verified';

export const ringSvg = (phase: OrbitPhase): CSSProperties => ({
  position: 'absolute',
  left: '50%',
  top: '50%',
  marginLeft: -LAYOUT.ringSize / 2,
  marginTop: -LAYOUT.ringSize / 2,
  overflow: 'visible',
  pointerEvents: 'none',
  transform: isVerdict(phase) ? 'scale(1.12)' : 'scale(1)',
  transition: 'transform .6s ease',
});

export const ringCircle = (phase: OrbitPhase): CSSProperties => ({
  stroke: isVerdict(phase) ? COLORS.ok : phase === 'error' ? COLORS.bad : COLORS.ice,
  // La pista es solo decorativa y la órbita no depende de ella: se deja
  // siempre invisible. Para reactivarla: isVerdict ? 0.9 : isActive ? 0.5 : 0
  opacity: 0,
  transition: 'stroke .35s ease, opacity .35s ease',
});

export const hub = (phase: OrbitPhase): CSSProperties => ({
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: 7,
  height: 7,
  marginLeft: -3.5,
  marginTop: -3.5,
  borderRadius: '50%',
  background: isVerdict(phase) ? COLORS.ok : phase === 'error' ? COLORS.bad : COLORS.ice,
  opacity: isVerdict(phase)
    ? 0.85
    : phase === 'spin'
      ? 0.6
      : phase === 'error'
        ? 1
        : 0.3,
  transform: isVerdict(phase) ? 'scale(3.6)' : 'scale(1)',
  boxShadow: isVerdict(phase)
    ? '0 0 22px 6px rgba(46,230,168,0.45)'
    : phase === 'error'
      ? '0 0 14px 3px rgba(255,77,106,0.5)'
      : 'none',
  transition: 'all .4s ease',
  pointerEvents: 'none',
});

const buttonBase: CSSProperties = {
  width: '100%',
  padding: '14px',
  fontWeight: 800,
  fontSize: 13,
  borderRadius: 10,
  border: 'none',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

export const submitButton = (opts: {
  disabled: boolean;
  ready: boolean;
  locked: boolean;
  codeFull: boolean;
}): CSSProperties => ({
  ...buttonBase,
  backgroundColor: opts.disabled ? '#1a1a1a' : '#1e90ff',
  color: opts.disabled ? '#444' : '#fff',
  cursor: opts.disabled ? 'not-allowed' : 'pointer',
  boxShadow:
    opts.codeFull && !opts.locked && opts.ready
      ? '0 4px 20px rgba(30,144,255,0.3)'
      : 'none',
});

export const continueButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: COLORS.ok,
  color: COLORS.okInk,
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(46,230,168,0.3)',
};

// ── CSS global (solo lo que no puede ir inline) ──────────────
export const GLOBAL_CSS = `
  .v2fa-input{width:100%;height:100%;background:transparent;border:0;outline:0;text-align:center;font-size:20px;font-weight:700;color:inherit;caret-color:${COLORS.ice};font-family:inherit;padding:0}
  .v2fa-tile:focus-within{box-shadow:0 0 0 1px rgba(220,234,255,.4),0 0 16px rgba(220,234,255,.28)}
  .v2fa-input:disabled{-webkit-text-fill-color:currentColor;opacity:1;cursor:default}
`;
