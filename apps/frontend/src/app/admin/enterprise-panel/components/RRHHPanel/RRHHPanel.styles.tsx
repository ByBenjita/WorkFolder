import css from 'styled-jsx/css';

export const rrhhStyles = css.global`
  /* ── Encabezado ───────────────────────────────────────────── */
  .rrhh-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 26px;
  }

  .rrhh-head-left {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .rrhh-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(150deg, var(--wf-primary-soft), oklch(0.99 0.01 256));
    border: 1px solid var(--wf-line);
    color: var(--wf-primary);
  }

  .rrhh-title {
    color: var(--wf-ink);
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.7px;
    line-height: 1.1;
    margin: 0 0 4px;
  }

  .rrhh-sub {
    color: var(--wf-muted);
    font-size: 13.5px;
    margin: 0;
  }

  /* ── Barra de filtros (tabs + empleado) ──────────────────── */
  .rrhh-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  /* ── Filtro por empleado ──────────────────────────────────── */
  .rrhh-emp-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .rrhh-emp-filter-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--wf-muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    white-space: nowrap;
  }

  .rrhh-emp-filter-select {
    padding: 7px 30px 7px 12px;
    border: 1px solid var(--wf-line);
    border-radius: 20px;
    background-color: var(--wf-surface);
    color: var(--wf-ink);
    font-size: 12.5px;
    font-weight: 600;
    font-family: var(--wf-sans);
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2399a0b0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    transition: border-color 0.14s ease, box-shadow 0.14s ease;
    max-width: 240px;
  }

  .rrhh-emp-filter-select:focus {
    border-color: var(--wf-primary);
    box-shadow: 0 0 0 3px var(--wf-primary-ring);
  }

  /* ── Filtros / tabs ───────────────────────────────────────── */
  .rrhh-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .rrhh-tab {
    padding: 7px 16px;
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--wf-line);
    background-color: var(--wf-surface);
    color: var(--wf-muted);
    transition: all 0.14s ease;
  }

  .rrhh-tab:hover {
    border-color: var(--wf-faint);
    color: var(--wf-ink-2);
  }

  .rrhh-tab.active {
    background-color: var(--wf-primary);
    border-color: var(--wf-primary);
    color: #ffffff;
    box-shadow: 0 3px 10px var(--wf-primary-ring);
  }

  /* ── Wrapper con scroll horizontal ───────────────────────── */
  .rrhh-table-wrap {
    overflow-x: auto;
    margin: 0 -24px;
    padding: 0 24px;
  }

  /* ── Tabla de documentos ──────────────────────────────────── */
  .rrhh-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    min-width: 700px;
  }

  .rrhh-table th {
    color: var(--wf-muted);
    text-align: left;
    padding: 10px 12px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1px solid var(--wf-line);
    white-space: nowrap;
  }

  .rrhh-table th:last-child {
    width: 90px;
    text-align: center;
  }

  .rrhh-table td {
    padding: 12px 12px;
    border-bottom: 1px solid var(--wf-line-soft);
    vertical-align: middle;
  }

  .rrhh-table td:last-child {
    text-align: center;
  }

  .rrhh-table tr:last-child td { border-bottom: none; }

  .rrhh-table tr:hover td {
    background-color: var(--wf-surface-2);
  }

  /* ── Celda archivo ────────────────────────────────────────── */
  .rrhh-file-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .rrhh-file-ico {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--wf-primary-soft);
    color: var(--wf-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    flex-shrink: 0;
  }

  .rrhh-file-name {
    color: var(--wf-ink);
    font-size: 13px;
    font-weight: 700;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .rrhh-file-size {
    color: var(--wf-faint);
    font-size: 11px;
    font-family: var(--wf-mono);
    margin: 2px 0 0;
  }

  /* ── Chips de tipo y estado ───────────────────────────────── */
  .chip-tipo {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    background-color: var(--wf-primary-soft);
    color: var(--wf-primary-strong);
  }

  .chip-firmado {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    background-color: var(--wf-safe-soft);
    color: var(--wf-safe-strong);
  }

  .chip-pendiente {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    background-color: var(--wf-warn-soft);
    color: oklch(0.55 0.12 70);
  }

  /* ── Celda empleado ───────────────────────────────────────── */
  .rrhh-emp {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .rrhh-avatar {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, var(--wf-primary), var(--wf-primary-strong));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 700;
    font-size: 12px;
    flex-shrink: 0;
  }

  .rrhh-emp-email {
    color: var(--wf-ink-2);
    font-size: 12.5px;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .rrhh-emp-name {
    color: var(--wf-faint);
    font-size: 11px;
    margin: 1px 0 0;
  }

  /* ── Botones de acción en fila ────────────────────────────── */
  .rrhh-actions {
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  .btn-sign {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    background-color: var(--wf-safe);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.14s ease, transform 0.12s ease;
  }

  .btn-sign:hover {
    background-color: var(--wf-safe-strong);
    transform: translateY(-1px);
  }

  .btn-dl {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    color: var(--wf-muted);
    border-radius: 7px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.14s ease;
  }

  .btn-dl:hover {
    border-color: var(--wf-primary);
    color: var(--wf-primary);
    background-color: var(--wf-primary-soft);
  }

  .btn-del {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    color: var(--wf-muted);
    border-radius: 7px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.14s ease;
  }

  .btn-del:hover {
    border-color: var(--wf-danger);
    color: var(--wf-danger);
    background-color: var(--wf-danger-soft);
  }

  /* ── Estado vacío ─────────────────────────────────────────── */
  .rrhh-empty {
    text-align: center;
    padding: 56px 24px;
    color: var(--wf-faint);
  }

  .rrhh-empty-icon {
    font-size: 40px;
    margin-bottom: 14px;
  }

  .rrhh-empty p {
    font-size: 14px;
    font-weight: 600;
    color: var(--wf-muted);
    margin: 0;
  }

  /* ── Modales ──────────────────────────────────────────────── */
  .rrhh-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0.2 0.02 264 / 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 16px;
  }

  .rrhh-modal {
    background: var(--wf-surface);
    border: 1px solid var(--wf-line);
    border-radius: var(--wf-radius);
    box-shadow: 0 20px 60px oklch(0.2 0.02 264 / 0.18);
    padding: 28px;
    width: 100%;
    max-width: 480px;
  }

  .rrhh-modal-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--wf-ink);
    letter-spacing: -0.4px;
    margin: 0 0 6px;
  }

  .rrhh-modal-sub {
    font-size: 13px;
    color: var(--wf-muted);
    margin: 0 0 22px;
  }

  /* ── Campos del formulario ────────────────────────────────── */
  .rrhh-field {
    margin-bottom: 16px;
  }

  .rrhh-label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--wf-muted);
    text-transform: uppercase;
    letter-spacing: 0.7px;
    margin-bottom: 7px;
  }

  .rrhh-select,
  .rrhh-input {
    width: 100%;
    padding: 10px 13px;
    border: 1px solid var(--wf-line);
    border-radius: var(--wf-radius-sm);
    background-color: var(--wf-surface-2);
    color: var(--wf-ink);
    font-size: 13.5px;
    font-family: var(--wf-sans);
    outline: none;
    transition: border-color 0.14s ease, box-shadow 0.14s ease;
    box-sizing: border-box;
  }

  .rrhh-select:focus,
  .rrhh-input:focus {
    border-color: var(--wf-primary);
    box-shadow: 0 0 0 3px var(--wf-primary-ring);
  }

  .rrhh-file-drop {
    border: 2px dashed var(--wf-line);
    border-radius: var(--wf-radius-sm);
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.14s ease, background 0.14s ease;
    background-color: var(--wf-surface-2);
  }

  .rrhh-file-drop:hover {
    border-color: var(--wf-primary);
    background-color: var(--wf-primary-soft);
  }

  .rrhh-file-drop p {
    margin: 0;
    font-size: 12.5px;
    color: var(--wf-muted);
  }

  .rrhh-file-drop.has-file {
    border-color: var(--wf-safe);
    background-color: var(--wf-safe-soft);
  }

  .rrhh-file-drop.has-file p {
    color: var(--wf-safe-strong);
    font-weight: 600;
  }

  /* ── Aviso de firma ───────────────────────────────────────── */
  .rrhh-sign-box {
    background-color: var(--wf-primary-soft);
    border: 1px solid oklch(0.55 0.17 256 / 0.25);
    border-radius: var(--wf-radius-sm);
    padding: 16px;
    margin-bottom: 20px;
  }

  .rrhh-sign-box p {
    margin: 0;
    font-size: 13px;
    color: var(--wf-primary-strong);
    line-height: 1.6;
  }

  .rrhh-sign-box strong {
    font-weight: 700;
  }

  /* ── Aviso de eliminación ─────────────────────────────────── */
  .rrhh-danger-box {
    background-color: var(--wf-danger-soft);
    border: 1px solid oklch(0.58 0.20 22 / 0.25);
    border-radius: var(--wf-radius-sm);
    padding: 14px 16px;
    margin-bottom: 20px;
    font-size: 13px;
    color: var(--wf-danger);
    font-weight: 600;
  }

  /* ── Error de acción ──────────────────────────────────────── */
  .rrhh-action-error {
    font-size: 12.5px;
    color: var(--wf-danger);
    font-weight: 600;
    margin: 12px 0 0;
    padding: 10px 14px;
    background-color: var(--wf-danger-soft);
    border-radius: 9px;
  }

  /* ── Botones de modal ─────────────────────────────────────── */
  .rrhh-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
  }

  .btn-modal-cancel {
    padding: 10px 18px;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    color: var(--wf-ink-2);
    font-size: 13px;
    font-weight: 600;
    border-radius: var(--wf-radius-sm);
    cursor: pointer;
    transition: all 0.14s ease;
  }

  .btn-modal-cancel:hover {
    border-color: var(--wf-faint);
    color: var(--wf-ink);
    background-color: var(--wf-surface-2);
  }

  .btn-modal-confirm {
    padding: 10px 20px;
    background-color: var(--wf-primary);
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    border: none;
    border-radius: var(--wf-radius-sm);
    cursor: pointer;
    box-shadow: 0 4px 12px var(--wf-primary-ring);
    transition: all 0.14s ease;
  }

  .btn-modal-confirm:hover:not(:disabled) {
    background-color: var(--wf-primary-strong);
    transform: translateY(-1px);
  }

  .btn-modal-confirm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-modal-danger {
    padding: 10px 20px;
    background-color: var(--wf-danger);
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    border: none;
    border-radius: var(--wf-radius-sm);
    cursor: pointer;
    transition: all 0.14s ease;
  }

  .btn-modal-danger:hover:not(:disabled) {
    background-color: oklch(0.50 0.20 22);
    transform: translateY(-1px);
  }

  .btn-modal-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ── Mensaje éxito ────────────────────────────────────────── */
  .rrhh-success {
    padding: 12px 18px;
    background-color: var(--wf-safe-soft);
    border: 1px solid oklch(0.62 0.13 158 / 0.35);
    border-radius: var(--wf-radius-sm);
    color: var(--wf-safe-strong);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;
