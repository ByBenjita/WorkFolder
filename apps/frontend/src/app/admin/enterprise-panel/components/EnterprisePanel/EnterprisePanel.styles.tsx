import css from 'styled-jsx/css';

export const panelStyles = css`
  .panel-main {
    flex: 1;
    padding: 32px 36px;
    overflow-y: auto;
    background-color: #0f0f0f;
  }

  /* ── Tipografía ── */
  .section-title {
    color: #ffffff;
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 24px;
    letter-spacing: -0.5px;
  }

  .card-title {
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    margin: 0;
  }

  /* ── Stats row ── */
  .stats-row {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .stat-card {
    flex: 1;
    padding: 20px 24px;
    background-color: #111111;
    border: 1px solid #1a1a1a;
    border-radius: 16px;
    min-width: 0;
  }

  .stat-card.accent {
    border-color: rgba(30, 144, 255, 0.2);
  }

  .stat-label {
    color: #2d3748;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 8px;
    font-weight: 700;
  }

  .stat-value {
    color: #ffffff;
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 4px;
  }

  .stat-value.accent {
    color: #1e90ff;
  }

  .stat-sub {
    color: #2d3748;
    font-size: 12px;
    margin: 0;
  }

  /* ── Card genérica ── */
  .card {
    background-color: #111111;
    border: 1px solid #1a1a1a;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .card:last-child {
    margin-bottom: 0;
  }

  /* ── Live indicator ── */
  .live-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    flex-shrink: 0;
  }

  /* ── Terminal / log ── */
  .terminal {
    background-color: #080808;
    border-radius: 10px;
    padding: 16px;
    font-family: monospace;
    font-size: 11px;
    overflow: auto;
  }

  .log-header {
    display: grid;
    grid-template-columns: 90px 1fr 1fr 100px 80px;
    gap: 8px;
    color: #1e90ff;
    font-weight: 700;
    padding-bottom: 8px;
    border-bottom: 1px solid #1a1a1a;
    margin-bottom: 8px;
  }

  .log-row {
    display: grid;
    grid-template-columns: 90px 1fr 1fr 100px 80px;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #0f0f0f;
    color: #4a9eff;
    align-items: center;
  }

  .log-row.security {
    color: #f87171;
  }

  .log-badge {
    background-color: rgba(30, 144, 255, 0.13);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    text-align: center;
  }

  .log-badge.security {
    background-color: rgba(248, 113, 113, 0.13);
  }

  .log-badge.other {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .log-user   { color: #6b8cae; }
  .log-action { color: #8899aa; }
  .log-ip     { color: #3d5a6c; }
  .log-date   { color: #2d4a5e; }

  /* ── Status bar ── */
  .status-bar {
    margin-top: 20px;
    padding: 10px 16px;
    background-color: #0d0d0d;
    border: 1px solid #151515;
    border-radius: 10px;
    font-size: 11px;
    color: #2d4a5e;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .green-dot {
    color: #22c55e;
    font-size: 8px;
  }

  /* ── Botones ── */
  .btn-primary {
    padding: 9px 16px;
    background-color: #1e90ff;
    color: #ffffff;
    font-weight: 700;
    font-size: 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    background-color: #1478e0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  .btn-primary-large {
    padding: 11px 20px;
    background-color: #1e90ff;
    color: #ffffff;
    font-weight: 800;
    font-size: 12px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
    transition: all 0.2s ease;
  }

  .btn-primary-large:hover {
    background-color: #1478e0;
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(30, 144, 255, 0.4);
  }

  .btn-ghost {
    background-color: transparent;
    border: 1px solid #1a1a1a;
    color: #4a5568;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s ease;
  }

  .btn-ghost:hover {
    border-color: #2d3748;
    color: #718096;
  }

  /* ── Tabla ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .data-table th {
    color: #2d3748;
    text-align: left;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #1a1a1a;
  }

  .data-table td {
    padding: 12px;
    border-bottom: 1px solid #0f0f0f;
  }

  .data-table tr:last-child td {
    border-bottom: none;
  }

  /* ── Chips / badges ── */
  .chip {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    background-color: rgba(255, 255, 255, 0.05);
    color: #4a5568;
  }

  .chip.green {
    background-color: rgba(34, 197, 94, 0.13);
    color: #22c55e;
  }

  .chip.blue {
    background-color: rgba(30, 144, 255, 0.13);
    color: #1e90ff;
  }

  /* ── Items row ── */
  .item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #0f0f0f;
  }

  .item-row:last-child {
    border-bottom: none;
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: rgba(30, 144, 255, 0.09);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .file-name {
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }

  .file-meta {
    color: #2d3748;
    font-size: 11px;
    margin: 2px 0 0;
  }

  /* ── Seguridad ── */
  .check-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #0f0f0f;
  }

  .check-row:last-child {
    border-bottom: none;
  }

  /* ── RRHH avatar ── */
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(30,144,255,0.2), rgba(30,144,255,0.4));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e90ff;
    font-weight: 800;
    font-size: 14px;
  }

  .receptor-name {
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }

  .receptor-meta {
    color: #2d3748;
    font-size: 11px;
    margin: 2px 0 0;
  }

  /* ── Card header row ── */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
`;
