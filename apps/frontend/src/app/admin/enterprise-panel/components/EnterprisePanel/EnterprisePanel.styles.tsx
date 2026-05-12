import css from 'styled-jsx/css';

export const panelStyles = css.global`
  .panel-main {
    flex: 1;
    padding: 32px 36px;
    overflow-y: auto;
    background-color: #f0f2f5;
    font-family: "Segoe UI", system-ui, sans-serif;
  }

  /* ── Tipografía ── */
  .section-title {
    color: #1a202c;
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 24px;
    letter-spacing: -0.5px;
  }

  .card-title {
    color: #1a202c;
    font-size: 14px;
    font-weight: 700;
    margin: 0;
  }

  .card-title-mb {
    margin-bottom: 16px;
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
    background-color: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    min-width: 0;
    text-align: center;
  }

  .stat-card.accent {
    border-color: #48bb78;
    background-color: #f0fff4;
  }

  .stat-label {
    color: #718096;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 8px;
    font-weight: 700;
  }

  .stat-card.accent .stat-label {
    color: #276749;
  }

  .stat-value {
    color: #1a202c;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 4px;
  }

  .stat-value.accent {
    color: #276749;
  }

  .stat-sub {
    color: #718096;
    font-size: 12px;
    margin: 0;
  }

  .stat-card.accent .stat-sub {
    color: #276749;
  }

  /* ── Card genérica ── */
  .card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .card:last-child {
    margin-bottom: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
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
    display: inline-block;
  }

  /* ── Terminal / log ── */
  .terminal {
    background-color: #1a202c;
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
    color: #63b3ed;
    font-weight: 700;
    padding-bottom: 8px;
    border-bottom: 1px solid #2d3748;
    margin-bottom: 8px;
  }

  .log-row {
    display: grid;
    grid-template-columns: 90px 1fr 1fr 100px 80px;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #2d3748;
    color: #90cdf4;
    align-items: center;
  }

  .log-row.security {
    color: #fc8181;
  }

  .log-badge {
    background-color: rgba(99, 179, 237, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    text-align: center;
    color: #90cdf4;
  }

  .log-badge.security {
    background-color: rgba(252, 129, 129, 0.2);
    color: #fc8181;
  }

  .log-badge.other {
    background-color: rgba(255, 255, 255, 0.08);
    color: #a0aec0;
  }

  .log-user   { color: #90cdf4; }
  .log-action { color: #a0aec0; }
  .log-ip     { color: #718096; }
  .log-date   { color: #718096; }

  /* ── Status bar ── */
  .status-bar {
    margin-top: 20px;
    padding: 10px 16px;
    background-color: #fff8e1;
    border: 1px solid #f6e05e;
    border-radius: 10px;
    font-size: 11px;
    color: #744210;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .green-dot {
    color: #f6ad55;
    font-size: 10px;
  }

  /* ── Botones ── */
  .btn-primary {
    padding: 9px 16px;
    background-color: #3182ce;
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
    background-color: #2b6cb0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
  }

  .btn-primary-large {
    padding: 11px 20px;
    background-color: #38a169;
    color: #ffffff;
    font-weight: 800;
    font-size: 12px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(56, 161, 105, 0.3);
    transition: all 0.2s ease;
  }

  .btn-primary-large:hover {
    background-color: #2f855a;
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(56, 161, 105, 0.4);
  }

  .btn-ghost {
    background-color: transparent;
    border: 1px solid #e2e8f0;
    color: #718096;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s ease;
  }

  .btn-ghost:hover {
    border-color: #cbd5e0;
    color: #4a5568;
    background-color: #f7fafc;
  }

  /* ── Tabla ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .data-table th {
    color: #718096;
    text-align: left;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
  }

  .data-table td {
    padding: 12px;
    border-bottom: 1px solid #f7fafc;
  }

  .data-table tr:last-child td {
    border-bottom: none;
  }

  .td-white { color: #1a202c; font-weight: 600; }
  .td-muted { color: #718096; }

  /* ── Chips ── */
  .chip {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    background-color: #edf2f7;
    color: #718096;
  }

  .chip.green {
    background-color: #c6f6d5;
    color: #276749;
  }

  .chip.blue {
    background-color: #bee3f8;
    color: #2b6cb0;
  }

  /* ── Items row ── */
  .item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f7fafc;
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
    background-color: #ebf8ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .file-name {
    color: #1a202c;
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }

  .file-meta {
    color: #a0aec0;
    font-size: 11px;
    margin: 2px 0 0;
  }

  /* ── Seguridad ── */
  .check-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f7fafc;
  }

  .check-row:last-child {
    border-bottom: none;
  }

  .check-ok  { color: #38a169; font-size: 16px; font-weight: 700; }
  .check-off { color: #cbd5e0; font-size: 16px; }
  .check-label-ok  { color: #2d3748; font-size: 13px; }
  .check-label-off { color: #cbd5e0; font-size: 13px; }

  /* ── RRHH avatar ── */
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #bee3f8, #90cdf4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2b6cb0;
    font-weight: 800;
    font-size: 14px;
  }

  .receptor-name { color: #1a202c; font-size: 13px; font-weight: 600; margin: 0; }
  .receptor-meta { color: #a0aec0; font-size: 11px; margin: 2px 0 0; }

  /* ── Texto utilitario ── */
  .text-muted { color: #4a5568; font-size: 13px; margin: 0; }
  .text-dim   { color: #a0aec0; font-size: 12px; margin: 0; }
  .mt-4  { margin-top: 4px; }
  .mt-8  { margin-top: 8px; }

  /* ── Facturación ── */
  .invoice-mes   { color: #4a5568; font-size: 13px; }
  .invoice-right { display: flex; align-items: center; gap: 16px; }
  .invoice-monto { color: #1a202c; font-weight: 700; font-size: 14px; }
`;
