import css from 'styled-jsx/css';

// Este archivo contiene estilos globales para el panel de empresa, aplicados a través de styled-jsx en el componente EnterprisePanel.

export const panelStyles = css.global`
  @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    /* acento */
    --wf-primary: oklch(0.55 0.17 256);
    --wf-primary-strong: oklch(0.48 0.18 256);
    --wf-primary-soft: oklch(0.95 0.03 256);
    --wf-primary-ring: oklch(0.55 0.17 256 / 0.30);

    --wf-safe: oklch(0.62 0.13 158);
    --wf-safe-strong: oklch(0.52 0.13 158);
    --wf-safe-soft: oklch(0.96 0.04 158);
    --wf-warn: oklch(0.74 0.12 78);
    --wf-warn-soft: oklch(0.97 0.05 86);
    --wf-danger: oklch(0.58 0.20 22);
    --wf-danger-soft: oklch(0.96 0.03 22);

    /* neutrales fríos */
    --wf-bg: oklch(0.972 0.004 256);
    --wf-surface: #ffffff;
    --wf-surface-2: oklch(0.985 0.003 256);
    --wf-ink: oklch(0.26 0.025 262);
    --wf-ink-2: oklch(0.44 0.02 262);
    --wf-muted: oklch(0.60 0.018 262);
    --wf-faint: oklch(0.72 0.015 262);
    --wf-line: oklch(0.92 0.006 262);
    --wf-line-soft: oklch(0.95 0.005 262);

    --wf-radius: 16px;
    --wf-radius-sm: 11px;
    --wf-shadow-sm: 0 1px 2px oklch(0.4 0.03 262 / 0.05), 0 1px 3px oklch(0.4 0.03 262 / 0.04);
    --wf-shadow-md: 0 4px 12px oklch(0.4 0.03 262 / 0.06), 0 2px 6px oklch(0.4 0.03 262 / 0.05);

    --wf-sans: "Hanken Grotesk", "Segoe UI", system-ui, sans-serif;
    --wf-mono: "JetBrains Mono", ui-monospace, monospace;
  }

  /* ── Contenedor ── */
  .panel-main {
    flex: 1;
    padding: 34px 38px;
    overflow-y: auto;
    background-color: var(--wf-bg);
    color: var(--wf-ink);
    font-family: var(--wf-sans);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Tipografía ── */
  .section-title {
    color: var(--wf-ink);
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 24px;
    letter-spacing: -0.7px;
    line-height: 1.1;
  }

  .card-title {
    color: var(--wf-ink);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.2px;
    margin: 0;
  }

  .card-title-mb { margin-bottom: 18px; }

  /* ── Stats row ── */
  .stats-row {
    display: flex;
    gap: 18px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .stat-card {
    flex: 1;
    min-width: 0;
    padding: 22px 24px;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    border-radius: var(--wf-radius);
    box-shadow: var(--wf-shadow-sm);
    text-align: left;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  }

  .stat-card:hover {
    box-shadow: var(--wf-shadow-md);
    transform: translateY(-2px);
  }

  /* tarjeta destacada → verde "seguro" */
  .stat-card.accent {
    border-color: var(--wf-safe);
    background: linear-gradient(180deg, var(--wf-safe-soft), var(--wf-surface));
  }

  .stat-card.accent::after {
    content: "";
    position: absolute;
    right: -30px; top: -30px;
    width: 120px; height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, oklch(0.62 0.13 158 / 0.12), transparent 70%);
  }

  .stat-label {
    color: var(--wf-muted);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 1.1px;
    margin: 0 0 12px;
    font-weight: 700;
  }

  .stat-card.accent .stat-label { color: var(--wf-safe-strong); }

  .stat-value {
    color: var(--wf-ink);
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1;
    margin: 0 0 8px;
  }

  .stat-value.accent { color: var(--wf-safe-strong); }

  .stat-sub {
    color: var(--wf-muted);
    font-size: 12.5px;
    margin: 0;
  }

  .stat-card.accent .stat-sub { color: var(--wf-safe-strong); }

  /* ── Card genérica ── */
  .card {
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    border-radius: var(--wf-radius);
    box-shadow: var(--wf-shadow-sm);
    padding: 24px;
    margin-bottom: 20px;
  }

  .card:last-child { margin-bottom: 0; }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  /* ── Live indicator ── */
  .live-row {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 16px;
  }

  .live-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background-color: var(--wf-safe);
    box-shadow: 0 0 0 0 oklch(0.62 0.13 158 / 0.5);
    animation: wf-pulse 2s infinite;
    flex-shrink: 0;
    display: inline-block;
  }

  @keyframes wf-pulse {
    0%, 100% { box-shadow: 0 0 0 0 oklch(0.62 0.13 158 / 0.5); }
    50%      { box-shadow: 0 0 0 6px oklch(0.62 0.13 158 / 0); }
  }

  /* ── Terminal / log ── */
  .terminal {
    background-color: oklch(0.225 0.03 264);
    border: 1px solid oklch(0.34 0.03 264);
    border-radius: 12px;
    padding: 16px;
    font-family: var(--wf-mono);
    font-size: 11px;
    overflow: auto;
  }

  .log-header {
    display: grid;
    grid-template-columns: 90px 1fr 1fr 100px 80px;
    gap: 8px;
    color: oklch(0.72 0.12 240);
    font-weight: 600;
    padding-bottom: 8px;
    border-bottom: 1px solid oklch(0.34 0.03 264);
    margin-bottom: 8px;
  }

  .log-row {
    display: grid;
    grid-template-columns: 90px 1fr 1fr 100px 80px;
    gap: 8px;
    padding: 7px 0;
    border-bottom: 1px solid oklch(0.30 0.03 264);
    color: oklch(0.80 0.06 240);
    align-items: center;
  }

  .log-row.security { color: oklch(0.72 0.15 22); }

  .log-badge {
    background-color: oklch(0.55 0.17 256 / 0.20);
    padding: 2px 7px;
    border-radius: 5px;
    font-size: 10px;
    font-weight: 700;
    text-align: center;
    color: oklch(0.80 0.08 240);
  }

  .log-badge.security {
    background-color: oklch(0.58 0.20 22 / 0.20);
    color: oklch(0.74 0.15 22);
  }

  .log-badge.other {
    background-color: oklch(1 0 0 / 0.08);
    color: oklch(0.72 0.02 262);
  }

  .log-user   { color: oklch(0.82 0.05 240); }
  .log-action { color: oklch(0.72 0.02 262); }
  .log-ip     { color: oklch(0.60 0.018 262); }
  .log-date   { color: oklch(0.60 0.018 262); }

  /* ── Status bar → banner E2EE verde ── */
  .status-bar {
    margin-top: 20px;
    padding: 14px 20px;
    background: linear-gradient(100deg, var(--wf-safe-soft), oklch(0.99 0.01 158));
    border: 1px solid oklch(0.62 0.13 158 / 0.35);
    border-radius: var(--wf-radius);
    font-size: 12.5px;
    font-weight: 600;
    color: var(--wf-safe-strong);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .green-dot {
    color: var(--wf-safe);
    font-size: 11px;
    filter: drop-shadow(0 0 5px oklch(0.62 0.13 158 / 0.6));
  }

  /* ── Botones ── */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 18px;
    background-color: var(--wf-primary);
    color: #ffffff;
    font-weight: 700;
    font-size: 13px;
    border: none;
    border-radius: var(--wf-radius-sm);
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 6px 14px var(--wf-primary-ring);
    transition: transform 0.12s ease, box-shadow 0.16s ease, background 0.16s ease;
  }

  .btn-primary:hover {
    background-color: var(--wf-primary-strong);
    transform: translateY(-1px);
    box-shadow: 0 9px 20px var(--wf-primary-ring);
  }

  .btn-primary-large {
    padding: 12px 22px;
    background-color: var(--wf-safe-strong);
    color: #ffffff;
    font-weight: 800;
    font-size: 12px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 6px 14px oklch(0.52 0.13 158 / 0.35);
    transition: transform 0.12s ease, box-shadow 0.16s ease, background 0.16s ease;
  }

  .btn-primary-large:hover {
    background-color: oklch(0.46 0.13 158);
    transform: translateY(-1px);
    box-shadow: 0 9px 22px oklch(0.52 0.13 158 / 0.45);
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    color: var(--wf-ink-2);
    padding: 7px 13px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: border-color 0.14s ease, color 0.14s ease, background 0.14s ease;
  }

  .btn-ghost:hover {
    border-color: var(--wf-faint);
    color: var(--wf-ink);
    background-color: var(--wf-surface-2);
  }

  /* ── Tabla ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .data-table th {
    color: var(--wf-muted);
    text-align: left;
    padding: 10px 12px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1px solid var(--wf-line);
  }

  .data-table td {
    padding: 13px 12px;
    border-bottom: 1px solid var(--wf-line-soft);
  }

  .data-table tr:last-child td { border-bottom: none; }

  .td-white { color: var(--wf-ink); font-weight: 600; }
  .td-muted { color: var(--wf-muted); }

  /* ── Chips ── */
  .chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    background-color: var(--wf-surface-2);
    color: var(--wf-muted);
    border: 1px solid var(--wf-line);
  }

  .chip.green {
    background-color: var(--wf-safe-soft);
    color: var(--wf-safe-strong);
    border-color: transparent;
  }

  .chip.blue {
    background-color: var(--wf-primary-soft);
    color: var(--wf-primary-strong);
    border-color: transparent;
  }

  /* ── Items row ── */
  .item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 15px 14px;
    margin: 0 -14px;
    border-radius: 12px;
    border-bottom: 1px solid var(--wf-line-soft);
    transition: background 0.14s ease;
  }

  .item-row:last-child { border-bottom: none; }
  .item-row:hover { background-color: var(--wf-surface-2); }

  .item-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .file-icon {
    width: 42px;
    height: 42px;
    border-radius: var(--wf-radius-sm);
    background: var(--wf-primary-soft);
    color: var(--wf-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    flex-shrink: 0;
  }

  .file-name {
    color: var(--wf-ink);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.2px;
    margin: 0;
  }

  .file-meta {
    color: var(--wf-faint);
    font-size: 11.5px;
    font-family: var(--wf-mono);
    margin: 3px 0 0;
  }

  /* ── Seguridad ── */
  .check-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--wf-line-soft);
  }

  .check-row:last-child { border-bottom: none; }

  .check-ok  { color: var(--wf-safe-strong); font-size: 16px; font-weight: 700; }
  .check-off { color: var(--wf-faint); font-size: 16px; }
  .check-label-ok  { color: var(--wf-ink-2); font-size: 13px; font-weight: 500; }
  .check-label-off { color: var(--wf-faint); font-size: 13px; }

  /* ── RRHH avatar ── */
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: linear-gradient(135deg, var(--wf-primary), var(--wf-primary-strong));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: -0.5px;
  }

  .receptor-name { color: var(--wf-ink); font-size: 13px; font-weight: 700; margin: 0; }
  .receptor-meta { color: var(--wf-faint); font-size: 11px; margin: 2px 0 0; }

  /* ── Texto utilitario ── */
  .text-muted { color: var(--wf-muted); font-size: 12.5px; margin: 0; }
  .text-dim   { color: var(--wf-faint); font-size: 12px; margin: 0; }
  .mt-4  { margin-top: 4px; }
  .mt-8  { margin-top: 8px; }

  /* ── Facturación ── */
  .invoice-mes   { color: var(--wf-ink-2); font-size: 13px; font-weight: 600; }
  .invoice-right { display: flex; align-items: center; gap: 16px; }
  .invoice-monto { color: var(--wf-ink); font-weight: 800; font-size: 14px; font-family: var(--wf-mono); }

  /* ════════════════════════════════════════════════════════════
     Rediseño Bóveda — elementos enriquecidos
     ════════════════════════════════════════════════════════════ */

  /* ── Encabezado de página ── */
  .page-head {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 26px;
  }

  .page-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--wf-primary);
    background: linear-gradient(150deg, var(--wf-primary-soft), oklch(0.99 0.01 256));
    border: 1px solid var(--wf-line);
  }

  .page-head .section-title { margin-bottom: 4px !important; }

  .page-sub {
    color: var(--wf-muted);
    font-size: 13.5px;
    margin: 0;
  }

  /* ── Stat: top + unidad + chip ── */
  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }

  .stat-top .stat-label { margin: 0; }

  .stat-unit {
    font-size: 15px;
    font-weight: 700;
    color: var(--wf-muted);
    margin-left: 6px;
    letter-spacing: 0;
  }

  .stat-card.accent .stat-unit { color: var(--wf-safe-strong); }

  .stat-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 20px;
    white-space: nowrap;
  }

  .stat-chip.neutral {
    background-color: var(--wf-surface-2);
    color: var(--wf-muted);
    border: 1px solid var(--wf-line);
  }

  .stat-chip.green {
    background-color: var(--wf-safe-soft);
    color: var(--wf-safe-strong);
  }

  /* ── Barra de almacenamiento ── */
  .stat-bar {
    height: 7px;
    border-radius: 20px;
    background-color: var(--wf-line);
    overflow: hidden;
    margin-top: 14px;
  }

  .stat-bar > i {
    display: block;
    height: 100%;
    border-radius: 20px;
    background: linear-gradient(90deg, var(--wf-primary), var(--wf-primary-strong));
  }

  .stat-scale {
    display: flex;
    justify-content: space-between;
    margin-top: 7px;
    font-size: 11px;
    color: var(--wf-faint);
    font-family: var(--wf-mono);
  }

  /* ── Sparkline ── */
  .spark {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 30px;
    margin-top: 12px;
  }

  .spark i {
    flex: 1;
    border-radius: 3px 3px 0 0;
    background-color: var(--wf-primary-soft);
    min-height: 2px;
  }

  .spark i.on { background-color: var(--wf-primary); }
  .stat-card.accent .spark i { background-color: oklch(0.62 0.13 158 / 0.25); }
  .stat-card.accent .spark i.on { background-color: var(--wf-safe); }

  /* ── File icon con badge de candado ── */
  .file-icon-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .lock-badge {
    position: absolute;
    right: -4px;
    bottom: -4px;
    width: 18px;
    height: 18px;
    border-radius: 6px;
    background-color: var(--wf-safe);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--wf-surface);
  }

  /* ── Nombre + tag Cifrado ── */
  .file-name-row {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .tag-cifrado {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 20px;
    background-color: var(--wf-safe-soft);
    color: var(--wf-safe-strong);
    flex-shrink: 0;
  }

  /* ── Botones de fila con icono ── */
  .item-row .btn-ghost { padding: 7px 12px; font-size: 12px; }
  .btn-ghost.btn-key:hover {
    color: oklch(0.55 0.12 70);
    border-color: var(--wf-warn);
    background-color: var(--wf-warn-soft);
  }
  .btn-ghost.btn-danger:hover {
    color: var(--wf-danger);
    border-color: var(--wf-danger);
    background-color: var(--wf-danger-soft);
  }

  /* ── Banner E2EE enriquecido ── */
  .enc-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 20px;
    padding: 18px 22px;
    background: linear-gradient(100deg, var(--wf-safe-soft), oklch(0.99 0.01 158));
    border: 1px solid oklch(0.62 0.13 158 / 0.35);
    border-radius: var(--wf-radius);
  }

  .enc-ic {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--wf-safe);
    color: #ffffff;
    box-shadow: 0 6px 14px oklch(0.62 0.13 158 / 0.35);
  }

  .enc-txt b {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--wf-safe-strong);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .enc-pulse {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--wf-safe);
    animation: wf-pulse 2s infinite;
    display: inline-block;
  }

  .enc-txt p {
    font-size: 12.5px;
    color: oklch(0.45 0.08 158);
    margin: 2px 0 0;
  }

  .enc-meta {
    margin-left: auto;
    text-align: right;
  }

  .enc-meta .k {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: oklch(0.5 0.07 158);
  }

  .enc-meta .v {
    font-size: 13px;
    font-weight: 600;
    color: var(--wf-safe-strong);
    font-family: var(--wf-mono);
  }

  @media (max-width: 720px) {
    .enc-meta { display: none; }
  }
`;
