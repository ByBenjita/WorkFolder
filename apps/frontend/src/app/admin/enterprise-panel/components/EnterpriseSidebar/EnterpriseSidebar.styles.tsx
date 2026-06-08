import css from 'styled-jsx/css';


export const sidebarStyles = css`
  .sidebar {
    width: 264px;
    height: 100vh;
    max-height: 100vh;
    position: sticky;
    top: 0;
    background: linear-gradient(180deg, oklch(0.255 0.03 264), oklch(0.225 0.03 264));
    border-right: 1px solid oklch(0.34 0.03 264);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    font-family: "Hanken Grotesk", "Segoe UI", system-ui, sans-serif;
  }

  /* ── Logo (fijo arriba) ── */
  .logo-section {
    flex-shrink: 0;
    padding: 22px 22px 18px;
    border-bottom: 1px solid oklch(0.34 0.03 264);
  }

  .logo-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .logo-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(150deg, oklch(0.55 0.17 256), oklch(0.48 0.18 256));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 6px 16px oklch(0.55 0.17 256 / 0.30), inset 0 1px 0 oklch(1 0 0 / 0.25);
    flex-shrink: 0;
  }

  .logo-icon :global(svg) { width: 22px; height: 22px; }

  .logo-title {
    color: #ffffff;
    font-weight: 800;
    font-size: 16px;
    letter-spacing: -0.3px;
    white-space: nowrap;
  }

  .logo-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 9.5px;
    color: oklch(0.66 0.02 264);
    letter-spacing: 1.4px;
    text-transform: uppercase;
    font-weight: 700;
    padding-left: 54px;
  }

  .logo-badge::before {
    content: "";
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: oklch(0.62 0.13 158);
    box-shadow: 0 0 7px oklch(0.62 0.13 158);
  }

  /* ── Nav (zona con scroll) ── */
  .nav {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav::-webkit-scrollbar { width: 6px; }
  .nav::-webkit-scrollbar-track { background: transparent; }
  .nav::-webkit-scrollbar-thumb {
    background-color: oklch(0.40 0.03 264);
    border-radius: 20px;
  }
  .nav::-webkit-scrollbar-thumb:hover { background-color: oklch(0.48 0.03 264); }
  .nav { scrollbar-width: thin; scrollbar-color: oklch(0.40 0.03 264) transparent; }

  .nav-group-label {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
    color: oklch(0.66 0.02 264);
    padding: 14px 12px 7px;
  }

  .nav-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    background-color: transparent;
    color: oklch(0.66 0.02 264);
    font-size: 13.5px;
    font-weight: 600;
    font-family: inherit;
    position: relative;
    transition: background 0.16s ease, color 0.16s ease;
    text-align: left;
  }

  .nav-button:hover {
    background-color: oklch(1 0 0 / 0.05);
    color: oklch(0.96 0.01 264);
  }

  .nav-button.active {
    background-color: oklch(1 0 0 / 0.07);
    color: #ffffff;
    font-weight: 700;
  }

  .nav-button.active::before {
    content: "";
    position: absolute;
    left: -14px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    border-radius: 0 3px 3px 0;
    background-color: oklch(0.55 0.17 256);
    box-shadow: 0 0 12px oklch(0.55 0.17 256 / 0.40);
  }

  .nav-button.active .nav-icon { color: oklch(0.62 0.20 256); }

  .nav-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nav-icon :global(svg) { width: 18px; height: 18px; }

  .nav-label { flex: 1; white-space: nowrap; }

  .nav-badge {
    font-size: 10.5px;
    background-color: oklch(1 0 0 / 0.08);
    color: oklch(0.62 0.13 158);
    padding: 2px 7px;
    border-radius: 20px;
    font-weight: 700;
    min-width: 34px;
    text-align: center;
  }

  .nav-badge.active {
    background-color: oklch(0.55 0.17 256);
    color: #ffffff;
  }

  /* ── Footer (anclado abajo, nunca se corta) ── */
  .sidebar-footer {
    flex-shrink: 0;
    padding: 14px;
    border-top: 1px solid oklch(0.34 0.03 264);
  }

  .session-info {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px;
    border-radius: 12px;
    background-color: oklch(1 0 0 / 0.04);
    border: 1px solid oklch(1 0 0 / 0.06);
    margin-bottom: 10px;
  }

  .session-avatar {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 700;
    font-size: 13px;
    background: linear-gradient(135deg, oklch(0.55 0.17 256), oklch(0.48 0.18 256));
  }

  .session-text { min-width: 0; }

  .session-label {
    color: oklch(0.66 0.02 264);
    font-size: 9px;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
  }

  .session-email {
    color: oklch(0.96 0.01 264);
    font-size: 11.5px;
    font-weight: 600;
    margin: 3px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logout-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background-color: transparent;
    border: 1px solid oklch(0.34 0.03 264);
    border-radius: 10px;
    color: oklch(0.66 0.02 264);
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
  }

  .logout-button:hover {
    border-color: oklch(0.44 0.03 264);
    color: oklch(0.96 0.01 264);
    background-color: oklch(1 0 0 / 0.05);
  }

  .logout-button:disabled { opacity: 0.6; cursor: not-allowed; }
`;
