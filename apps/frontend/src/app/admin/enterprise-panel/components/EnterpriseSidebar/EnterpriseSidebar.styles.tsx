import css from 'styled-jsx/css';

export const sidebarStyles = css`
  .sidebar {
    width: 220px;
    min-height: 100vh;
    background-color: #0d0d0d;
    border-right: 1px solid #1a1a1a;
    display: flex;
    flex-direction: column;
    padding: 24px 0;
    flex-shrink: 0;
  }

  /* ── Logo ── */
  .logo-section {
    padding: 0 20px 24px;
    border-bottom: 1px solid #222;
  }

  .logo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #1e90ff, #0066cc);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  }

  .logo-title {
    color: #ffffff;
    font-weight: 800;
    font-size: 15px;
  }

  .logo-badge {
    font-size: 10px;
    color: #4a9eff;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: 600;
  }

  /* ── Nav ── */
  .nav {
    flex: 1;
    padding: 16px 12px;
  }

  .nav-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    background-color: transparent;
    color: #8899aa;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 2px;
    transition: all 0.15s ease;
    text-align: left;
  }

  .nav-button:hover {
    background-color: rgba(255, 255, 255, 0.06);
    color: #c0cfe0;
  }

  .nav-button.active {
    background-color: rgba(30, 144, 255, 0.15);
    color: #4a9eff;
    font-weight: 700;
  }

  .nav-icon {
    width: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nav-label {
    flex: 1;
  }

  .nav-badge {
    font-size: 10px;
    background-color: rgba(255, 255, 255, 0.08);
    color: #8899aa;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 700;
  }

  .nav-badge.active {
    background-color: rgba(30, 144, 255, 0.2);
    color: #4a9eff;
  }

  /* ── Footer ── */
  .sidebar-footer {
    padding: 16px 16px 0;
    border-top: 1px solid #222;
  }

  .session-info {
    margin-bottom: 10px;
  }

  .session-label {
    color: #4a5568;
    font-size: 10px;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .session-email {
    color: #8899aa;
    font-size: 11px;
    margin: 2px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logout-button {
    width: 100%;
    padding: 8px;
    background-color: transparent;
    border: 1px solid #222;
    border-radius: 8px;
    color: #8899aa;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 16px;
  }

  .logout-button:hover {
    border-color: #444;
    color: #c0cfe0;
    background-color: rgba(255, 255, 255, 0.04);
  }
`;
