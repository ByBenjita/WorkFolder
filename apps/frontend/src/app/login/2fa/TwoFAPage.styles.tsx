import css from 'styled-jsx/css';

export const twoFAStyles = css`
  .tfa-root {
    min-height: 100vh;
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), 
      url('/background.png');
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Segoe UI", system-ui, sans-serif;
  }

  /* Card Ultra Compacta */
  .tfa-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 340px;
    padding: 24px 20px;
    background-color: #121212; 
    border: 1px solid #222;
    border-radius: 40px; 
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    text-align: center;
  }

  .tfa-title {
    color: #ffffff;
    font-size: 19px;
    font-weight: 700;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .tfa-description {
    color: #5d6d7e;
    font-size: 11px;
    line-height: 1.3;
    margin-bottom: 16px;
  }

  .tfa-step {
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 10px;
    display: block;
  }

  .qr-container {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .qr-wrapper {
    background: #ffffff;
    padding: 8px;
    border-radius: 6px;
  }

  /* Recuadros de código con Glow RGB */
  .tfa-input-group {
    display: flex;
    gap: 4px;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
  }

  .tfa-input {
    width: 32px;
    height: 42px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    border-radius: 6px;
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    outline: none;
    transition: all 0.3s ease;
  }

  .tfa-input:focus {
    border-color: #3b82f6;
    background-color: rgba(59, 158, 255, 0.1);
    /* Glow Azul */
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.6), 
                0 0 15px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }

  .tfa-separator {
    color: #3b82f6;
    font-size: 16px;
    font-weight: bold;
  }

  /* Botón con resaltado Glow al pasar el mouse */
  .tfa-button {
    width: 100%;
    background-color: #4f8cf6;
    color: #000000;
    font-weight: 800;
    font-size: 13px;
    padding: 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    text-transform: uppercase;
    margin-bottom: 16px;
    transition: all 0.3s ease;
  }

  .tfa-button:hover {
    background-color: #60a5fa;
    transform: translateY(-2px);
    /* Glow del Botón */
    box-shadow: 0 0 15px rgba(79, 140, 246, 0.6), 
                0 0 30px rgba(79, 140, 246, 0.3);
  }

  .tfa-button:active {
    transform: translateY(0);
    box-shadow: 0 0 5px rgba(79, 140, 246, 0.8);
  }

  .tfa-footer {
    color: #3e4a59;
    font-size: 11px;
    font-weight: 600;
  }
`;