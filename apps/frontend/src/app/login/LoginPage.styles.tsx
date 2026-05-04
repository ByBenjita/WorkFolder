import css from 'styled-jsx/css';

export const loginStyles = css`
  /* ── Root ── */
  .login-root {
    min-height: 100vh;
    background-color: #0d0d0d;
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
    background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  /* ── Card ── */
  .login-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 560px;
    padding: 0 24px;
  }

  .card-content {
    background-color: #171717;
    border: 1px solid #2a2a2a;
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .login-title {
    color: #ffffff;
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 8px;
    text-align: center;
  }

  .login-subtitle {
    color: #a1a1aa;
    text-align: center;
    margin-bottom: 40px;
  }

  /* ── Inputs ── */
  .input-group {
    margin-bottom: 24px;
  }

  .input-label {
    display: block;
    color: #a1a1aa;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .login-input {
    width: 100%;
    background-color: #222222;
    border: 1px solid #3b9eff;
    border-radius: 12px;
    padding: 14px 16px;
    color: #ffffff;
    outline: none;
    transition: all 0.2s;
  }

  .login-input:focus {
    background-color: #2a2a2a;
    box-shadow: 0 0 0 2px rgba(59, 158, 255, 0.2);
  }

  /* ── Button ── */
  .login-button {
    width: 100%;
    background-color: #1e90ff;
    color: #ffffff;
    font-weight: 700;
    padding: 16px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    margin-top: 8px;
    transition: background-color 0.2s;
  }

  .login-button:hover {
    background-color: #1478e0;
  }

  .forgot-link {
    display: block;
    text-align: center;
    color: #a1a1aa;
    font-size: 14px;
    margin-top: 24px;
    text-decoration: none;
  }
`;