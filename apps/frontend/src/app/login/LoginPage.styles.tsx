import css from 'styled-jsx/css';

export const loginStyles = css`
  .login-root {
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
    font-family: "Segoe UI", system-ui, sans-serif;
  }

  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .login-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 560px;
    padding: 0 24px;
  }

  .card-content {
    background-color: rgba(23, 23, 23, 0.45); 
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  }

  .login-title {
    color: #ffffff;
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 8px;
    text-align: center;
    letter-spacing: -0.5px;
  }

  .login-subtitle {
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    margin-bottom: 40px;
    font-size: 15px;
  }

  .input-group {
    margin-bottom: 24px;
  }

  .input-label {
    display: block;
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .login-input {
    width: 100%;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(59, 158, 255, 0.3);
    border-radius: 12px;
    padding: 14px 16px;
    color: #ffffff;
    outline: none;
    transition: all 0.3s ease;
  }

  .login-input:focus {
    background-color: rgba(255, 255, 255, 0.07);
    border-color: #1e90ff;
    box-shadow: 0 0 0 4px rgba(30, 144, 255, 0.15);
  }

  .login-input::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }

  /* ── Password wrapper ── */
  .password-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .password-input {
    padding-right: 48px;
    width: 100%;
    box-sizing: border-box;
  }

  .password-toggle {
    position: absolute;
    right: 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.2s ease;
  }

  .password-toggle:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  /* ── Button de Acción ── */
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
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  .login-button:hover {
    background-color: #1478e0;
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(30, 144, 255, 0.4);
  }

  .login-button:active {
    transform: translateY(0);
  }

  .login-button:disabled {
    background-color: #333;
    cursor: not-allowed;
    box-shadow: none;
  }

  .forgot-link {
    display: block;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
    margin-top: 24px;
    text-decoration: none;
    transition: color 0.2s;
  }

  .forgot-link:hover {
    color: #ffffff;
    text-decoration: underline;
  }
`;