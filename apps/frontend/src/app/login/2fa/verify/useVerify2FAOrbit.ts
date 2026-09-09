import { useCallback, useEffect, useRef, useState } from 'react';
import { useVerify2FA } from './useVerify2FA';

/**
 * Orquestación de la animación de verificación 2FA.
 *
 * Envuelve a `useVerify2FA` (lógica de auth) y le añade la máquina de fases
 * del "orbit": fila → órbita → giro → atornillado → verificado. El diseño
 * vive en `Verify2FAPage.styles.tsx`; aquí solo hay estado y tiempos.
 */

export type OrbitPhase =
  | 'input'
  | 'orbit'
  | 'spin'
  | 'screw'
  | 'verified'
  | 'error';

// Tiempos de cada tramo de la secuencia (ms)
const T = {
  curl: 520,
  spin: 1000,
  screw: 520,
  read: 1500,
  stillOk: 700,
  stillInvalid: 600,
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useVerify2FAOrbit = () => {
  const {
    code,
    loading,
    ready,
    handleInputChange,
    handleKeyDown,
    handleSubmit,
    finishSuccess,
    resetCode,
  } = useVerify2FA();

  const N = code.length;

  const [phase, setPhase] = useState<OrbitPhase>('input');
  const [netError, setNetError] = useState(false);
  const [invalidCode, setInvalidCode] = useState(false);
  const busyRef = useRef(false);
  const doneRef = useRef(false);

  // Foco en el primer dígito al montar
  useEffect(() => {
    document.getElementById('otp-0')?.focus();
  }, []);

  /** Limpia cualquier aviso de error (al volver a escribir o reintentar). */
  const clearNotices = useCallback(() => {
    setNetError(false);
    setInvalidCode(false);
  }, []);

  const finishOnce = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    finishSuccess();
  }, [finishSuccess]);

  /** Cierra el intento sin castigar al usuario cuando el fallo fue transitorio. */
  const bailTransient = useCallback(() => {
    setNetError(true);
    setPhase('input');
    busyRef.current = false;
  }, []);

  const runSubmit = useCallback(async () => {
    if (busyRef.current || loading) return;
    if (code.join('').length !== N) return;
    if (!ready) return; // aún no cargó el factor MFA: no intentar
    busyRef.current = true;
    clearNotices();

    // Sin animación: solo veredicto
    if (prefersReducedMotion()) {
      const r = await handleSubmit();
      if (r === 'ok') {
        setPhase('verified');
        await wait(T.stillOk);
        finishOnce();
      } else if (r === 'invalid') {
        setInvalidCode(true);
        setPhase('error');
        await wait(T.stillInvalid);
        resetCode();
        setPhase('input');
        busyRef.current = false;
      } else {
        bailTransient();
      }
      return;
    }

    // Con animación: la red corre en paralelo al giro
    setPhase('orbit');
    const verifyP = handleSubmit();
    await wait(T.curl);

    setPhase('spin');
    const [r] = await Promise.all([verifyP, wait(T.spin)]);

    if (r === 'ok') {
      setPhase('screw');
      await wait(T.screw);
      setPhase('verified');
      await wait(T.read);
      finishOnce();
    } else if (r === 'invalid') {
      setInvalidCode(true);
      setPhase('error');
      await wait(760);
      resetCode(); // solo se limpia ante un rechazo real del servidor
      setPhase('input');
      busyRef.current = false;
    } else {
      // 'blocked': no se pudo verificar; se conserva lo escrito y no se marca rojo
      bailTransient();
    }
  }, [loading, code, N, ready, handleSubmit, finishOnce, resetCode, bailTransient, clearNotices]);

  // Auto-envío al completar los 6 dígitos, pero solo cuando el factor ya cargó
  useEffect(() => {
    if (
      phase === 'input' &&
      ready &&
      !busyRef.current &&
      code.every((d) => d !== '')
    ) {
      runSubmit();
    }
  }, [code, phase, ready, runSubmit]);

  const locked = phase !== 'input';
  const codeFull = code.join('').length === N;

  return {
    // datos / entrada
    code,
    loading,
    ready,
    handleInputChange,
    handleKeyDown,
    clearNotices,
    // estado de la secuencia
    phase,
    netError,
    invalidCode,
    locked,
    isDone: phase === 'verified',
    codeFull,
    submitDisabled: locked || loading || !ready || !codeFull,
    // acciones
    runSubmit,
    finishOnce,
  };
};
