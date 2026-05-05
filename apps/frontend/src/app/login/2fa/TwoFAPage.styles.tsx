import css from 'styled-jsx/css';

export const twoFAStyles = css`
  /* Contenedor principal */
  .tfa-root {
    min-height: 100vh;
    background-color: #0d0d0d;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* Fondo de malla */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  /* Tarjeta central */
  .tfa-card {
    position: relative;
    z-index: 10;
    background-color: #171717;
    border: 1px solid #2a2a2a;
    border-radius: 24px;
    padding: 48px 32px;
    text-align: center;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  }

  /* Título y subtítulos corregidos */
  .tfa-title {
    color: #dfdfdf; /* El color que pediste */
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }

  .tfa-subtitle {
    color: #dfdfdf; /* Color igual al título */
    font-size: 14px;
    margin-bottom: 2rem;
    opacity: 0.9; /* Un toque sutil para diferenciar jerarquía sin cambiar el tono */
  }

  /* Contenedor del QR */
  .qr-container {
    display: flex;
    justify-content: center;
    margin-bottom: 3.5rem; 
  }

  .qr-wrapper {
    background-color: #ffffff;
    padding: 16px;
    border-radius: 16px;
    display: inline-block;
  }

  /* Grupo de los 6 inputs */
  .tfa-input-group {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 32px;
  }

  .tfa-input {
    width: 48px;
    height: 60px;
    background-color: #222222;
    border: 2px solid #3b9eff;
    border-radius: 12px;
    color: #ffffff;
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    outline: none;
  }

  /* Botón de verificación */
  .tfa-button {
    width: 100%;
    background-color: #1e90ff;
    color: #ffffff;
    font-weight: 700;
    padding: 16px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
  }

  .tfa-button:hover {
    background-color: #1478e0;
  }
`;