import css from 'styled-jsx/css';

export const twoFAStyles = css`
  .tfa-root {
    min-height: 100vh;
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)),
      url('/background.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 24px;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }

  .grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  /* ── Tarjeta (mismo lenguaje que el login: glass + azul) ── */
  .tfa-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 430px;
    background-color: rgba(23, 23, 23, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px 36px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    text-align: center;
  }

  .tfa-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 18px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    background: linear-gradient(
      135deg,
      rgba(30, 144, 255, 0.16),
      rgba(30, 144, 255, 0.3)
    );
    border: 1px solid rgba(30, 144, 255, 0.35);
  }

  .tfa-title {
    color: #ffffff;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.4px;
    margin-bottom: 8px;
  }

  .tfa-subtitle {
    color: rgba(255, 255, 255, 0.55);
    font-size: 13px;
    line-height: 1.55;
    margin-bottom: 26px;
  }

  /* ── Paso numerado ── */
  .tfa-step {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    margin-bottom: 14px;
  }

  .tfa-step-num {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    border-radius: 7px;
    background: rgba(30, 144, 255, 0.14);
    border: 1px solid rgba(30, 144, 255, 0.4);
    color: #4aa8ff;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tfa-step-text {
    color: rgba(255, 255, 255, 0.72);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
  }

  .tfa-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.07);
    margin: 22px 0;
  }

  /* ── QR ── */
  .tfa-qr {
    display: flex;
    justify-content: center;
    margin: 6px 0 4px;
  }

  .tfa-qr-frame {
    padding: 14px;
    background: #ffffff;
    border-radius: 14px;
    box-shadow:
      0 0 0 1px rgba(30, 144, 255, 0.25),
      0 12px 30px rgba(0, 0, 0, 0.45);
  }

  .tfa-qr-frame img {
    display: block;
    border-radius: 4px;
  }

  .tfa-qr-loading {
    width: 160px;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9aa0a6;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    border: 1px dashed rgba(0, 0, 0, 0.15);
    border-radius: 6px;
  }

  /* ── Casillas OTP (mismo estilo que la pantalla de verificación) ── */
  .tfa-otp {
    display: flex;
    gap: 7px;
    justify-content: center;
    align-items: center;
    margin-bottom: 22px;
  }

  .tfa-otp-input {
    width: 40px;
    height: 50px;
    background-color: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    outline: none;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .tfa-otp-input:focus {
    border-color: #1e90ff;
    background-color: rgba(30, 144, 255, 0.1);
    box-shadow: 0 0 0 4px rgba(30, 144, 255, 0.15);
  }

  .tfa-otp-sep {
    color: rgba(255, 255, 255, 0.22);
    font-size: 18px;
    font-weight: 700;
  }

  /* ── Botón (estilo de la app) ── */
  .tfa-button {
    width: 100%;
    background-color: #1e90ff;
    color: #ffffff;
    font-weight: 700;
    font-size: 14px;
    padding: 15px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  .tfa-button:hover:not(:disabled) {
    background-color: #1478e0;
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(30, 144, 255, 0.4);
  }

  .tfa-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .tfa-button:disabled {
    background-color: #2a2a2a;
    color: #6b7280;
    cursor: not-allowed;
    box-shadow: none;
  }

  .tfa-footer {
    color: rgba(255, 255, 255, 0.3);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    margin-top: 20px;
  }
`;
