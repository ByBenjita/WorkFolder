import css from 'styled-jsx/css';

export const twoFAStyles = css`
  /* ── Root con Imagen Formal ── */
  .tfa-root {
    min-height: 100vh;
    /* Mismo fondo que el login para coherencia visual */
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
    font-family: "Segoe UI", system-ui, sans-serif;
  }

  /* ── Grid background ── */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  /* ── Card Transparente (Glassmorphism) ── */
  .tfa-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 450px;
    margin: 0 24px;
    padding: 48px;
    
    /* Fondo translúcido y desenfoque */
    background-color: rgba(23, 23, 23, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    text-align: center;
  }

  .tfa-title {
    color: #ffffff;
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .tfa-subtitle {
    color: rgba(255, 255, 255, 0.6);
    font-size: 15px;
    margin-bottom: 32px;
    line-height: 1.5;
  }

  /* ── QR Container ── */
  .qr-container {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  }

  .qr-wrapper {
    background: white;
    padding: 12px;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  /* ── OTP Inputs ── */
  .tfa-input-group {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 32px;
  }

  .tfa-input {
    width: 45px;
    height: 55px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(59, 158, 255, 0.3);
    border-radius: 12px;
    text-align: center;
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    outline: none;
    transition: all 0.3s ease;
  }

  .tfa-input:focus {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: #1e90ff;
    box-shadow: 0 0 0 4px rgba(30, 144, 255, 0.15);
  }

  /* ── Button ── */
  .tfa-button {
    width: 100%;
    background-color: #1e90ff;
    color: #ffffff;
    font-weight: 700;
    padding: 16px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  .tfa-button:hover {
    background-color: #1478e0;
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(30, 144, 255, 0.4);
  }

  .tfa-button:active {
    transform: translateY(0);
  }
`;