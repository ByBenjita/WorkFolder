'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerify2FAOrbit } from './useVerify2FAOrbit';
import PageTransition from '../../../components/PageTransition';
import {
  COLORS,
  GLOBAL_CSS,
  LAYOUT,
  S,
  actionDoneMotion,
  actionFormMotion,
  continueButton,
  groupVariants,
  heading,
  headSwapMotion,
  hub,
  iconBox,
  invalidNoticeMotion,
  noticeMotion,
  ringCircle,
  ringSvg,
  spark,
  submitButton,
  tileVariants,
  verdictTileMotion,
  verdictTransition,
} from './Verify2FAPage.styles';

export default function Verify2FAPage() {
  const {
    code,
    loading,
    ready,
    handleInputChange,
    handleKeyDown,
    clearNotices,
    phase,
    netError,
    invalidCode,
    locked,
    isDone,
    codeFull,
    submitDisabled,
    runSubmit,
    finishOnce,
  } = useVerify2FAOrbit();

  const showVerdict = phase === 'screw' || phase === 'verified';

  return (
    <PageTransition direction="left">
      <style>{GLOBAL_CSS}</style>

      <main style={S.main}>
        <div style={S.card}>
          {/* Icono */}
          <div style={iconBox(isDone)}>{isDone ? '🛡️' : '🔑'}</div>

          {/* Encabezado */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={isDone ? 'head-done' : 'head-form'} {...headSwapMotion}>
              <h1 style={heading(isDone)}>
                {isDone ? 'Verificado con éxito' : 'Verificación 2FA'}
              </h1>
              <p style={S.subtitle}>
                {isDone
                  ? 'Tu número ha sido verificado.'
                  : 'Ingresa el código de 6 dígitos de tu aplicación de autenticación (Google Authenticator, Authy, etc.)'}
              </p>
            </motion.div>
          </AnimatePresence>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSubmit();
            }}
          >
            {/* Pista + punto + casilla verificada + dígitos */}
            <div style={S.orbitBox}>
              {/* Anillo punteado */}
              <svg
                width={LAYOUT.ringSize}
                height={LAYOUT.ringSize}
                viewBox="0 0 120 120"
                aria-hidden="true"
                style={ringSvg(phase)}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray="2 7"
                  strokeLinecap="round"
                  strokeWidth={1.4}
                  style={ringCircle(phase)}
                />
              </svg>

              {/* Punto / eje */}
              <span aria-hidden="true" style={hub(phase)} />

              {/* La única casilla verificada */}
              <motion.div
                aria-hidden="true"
                style={S.verdictTile}
                initial={verdictTileMotion.initial}
                animate={showVerdict ? verdictTileMotion.shown : verdictTileMotion.hidden}
                transition={verdictTransition(phase)}
              >
                <svg viewBox="0 0 24 24" width={26} height={26} fill="none">
                  <motion.path
                    d="M4 12.5 L10 18 L20 6"
                    stroke={COLORS.okInk}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: showVerdict ? 1 : 0 }}
                    transition={{ duration: 0.32, delay: 0.2, ease: 'easeOut' }}
                  />
                </svg>
              </motion.div>

              {/* Chispas */}
              {phase === 'verified' &&
                Array.from({ length: LAYOUT.sparks }).map((_, k) => {
                  const s = spark(k);
                  return (
                    <motion.span
                      key={k}
                      aria-hidden="true"
                      style={S.spark}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x: s.to.x,
                        y: s.to.y,
                        scale: [0, 1, 0],
                        opacity: [1, 1, 0],
                      }}
                      transition={{ duration: 0.9, delay: s.delay, ease: 'easeOut' }}
                    />
                  );
                })}

              {/* Fila de dígitos (gira como grupo) */}
              <motion.div
                style={S.digitGroup}
                variants={groupVariants}
                initial="input"
                animate={phase}
              >
                {code.map((digit, index) => (
                  <motion.div
                    key={index}
                    className="v2fa-tile"
                    custom={index}
                    variants={tileVariants}
                    style={S.digitTile}
                  >
                    <input
                      id={`otp-${index}`}
                      className="v2fa-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        clearNotices();
                        handleInputChange(e.target.value, index);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      disabled={locked || loading}
                      aria-label={`Dígito ${index + 1}`}
                      required
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Avisos de error */}
            <AnimatePresence mode="wait" initial={false}>
              {invalidCode ? (
                <motion.div
                  key="invalid-code"
                  style={S.noticeInvalid}
                  {...invalidNoticeMotion}
                >
                  <span aria-hidden="true">⚠</span> Código inválido. Inténtalo de nuevo.
                </motion.div>
              ) : netError && !locked ? (
                <motion.p key="net-error" style={S.notice} {...noticeMotion}>
                  No se pudo verificar. Revisa tu conexión y reinténtalo.
                </motion.p>
              ) : null}
            </AnimatePresence>

            {/* Zona de acción */}
            <AnimatePresence mode="wait" initial={false}>
              {isDone ? (
                <motion.div key="btn-done" {...actionDoneMotion}>
                  <div style={S.secureLine}>
                    <span aria-hidden="true">✓</span> Verificado y seguro
                  </div>
                  <button type="button" onClick={finishOnce} style={continueButton}>
                    Continuar
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="btn-form"
                  type="submit"
                  disabled={submitDisabled}
                  {...actionFormMotion}
                  style={submitButton({ disabled: submitDisabled, ready, locked, codeFull })}
                >
                  {phase === 'error'
                    ? 'Código inválido'
                    : locked
                      ? 'Verificando…'
                      : !ready
                        ? 'Preparando…'
                        : 'Ingresar al Sistema'}
                </motion.button>
              )}
            </AnimatePresence>
          </form>

          <p style={S.footer}>WorkFolder Secure Vault · Enterprise</p>
        </div>
      </main>
    </PageTransition>
  );
}
