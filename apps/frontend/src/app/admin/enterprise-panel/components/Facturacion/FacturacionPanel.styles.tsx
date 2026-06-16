import css from 'styled-jsx/css';

export const facturacionStyles = css.global`
  /* ── Wrapper oscuro — cubre el padding de .panel-main ── */
  .fact-wrapper {
    margin: -34px -38px;
    padding: 48px 48px 56px;
    min-height: calc(100% + 68px);
    background-color: #111114;
    color: #e8e8ef;
    font-family: var(--wf-sans, "Hanken Grotesk", system-ui, sans-serif);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Título principal ── */
  .fact-title {
    text-align: center;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.8px;
    color: #f0f0f5;
    margin: 0 0 40px;
    line-height: 1.1;
  }

  /* ── Grid de planes ── */
  .fact-plans {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 980px;
    margin: 0 auto 32px;
  }

  /* ── Tarjeta de plan ── */
  .fact-plan-card {
    background-color: #1a1a1f;
    border: 1px solid #2a2a35;
    border-radius: 20px;
    padding: 28px 24px 24px;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  .fact-plan-card:hover {
    border-color: #3a3a4a;
    transform: translateY(-2px);
  }

  .fact-plan-card.current {
    border: 2px solid oklch(0.55 0.17 256);
    box-shadow: 0 0 0 4px oklch(0.55 0.17 256 / 0.10);
  }

  /* ── Nombre del plan ── */
  .fact-plan-name {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin: 0 0 20px;
    color: oklch(0.72 0.06 260);
  }

  .fact-plan-name.primary { color: oklch(0.55 0.17 256); }
  .fact-plan-name.safe    { color: oklch(0.62 0.13 158); }

  /* ── Precio ── */
  .fact-plan-price { margin-bottom: 22px; }

  .fact-price-main {
    display: block;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -1px;
    color: #f0f0f5;
    line-height: 1;
  }

  .fact-price-iva {
    display: block;
    font-size: 13px;
    color: #666;
    margin-top: 5px;
  }

  /* ── Separador ── */
  .fact-separator {
    border: none;
    border-top: 1px solid #252530;
    margin: 0 0 20px;
  }

  /* ── Lista de características ── */
  .fact-features {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    flex: 1;
  }

  .fact-features li {
    font-size: 12.5px;
    color: #a0a0b8;
    padding: 5px 0;
    line-height: 1.4;
  }

  /* ── Bloque Módulo RRHH ── */
  .fact-rrhh-block {
    background-color: #0e0e12;
    border: 1px solid #1e2030;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 20px;
  }

  .fact-rrhh-title {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: oklch(0.62 0.13 158);
    text-transform: uppercase;
    margin: 0 0 8px;
  }

  .fact-rrhh-extra {
    font-size: 12px;
    color: #777;
    margin: 4px 0 0;
    line-height: 1.4;
  }

  /* ── Botones de plan ── */
  .fact-btn {
    width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    margin-top: auto;
    transition: opacity 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
  }

  .fact-btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .fact-btn:not(:disabled):hover { transform: translateY(-1px); }

  .fact-btn.current {
    background-color: #1e1e28;
    color: #555;
  }

  .fact-btn.neutral {
    background-color: #e8e8f0;
    color: #111114;
  }

  .fact-btn.neutral:not(:disabled):hover { background-color: #d8d8e0; }

  .fact-btn.safe {
    background-color: oklch(0.62 0.13 158);
    color: #fff;
    box-shadow: 0 4px 14px oklch(0.62 0.13 158 / 0.32);
  }

  .fact-btn.safe:not(:disabled):hover { background-color: oklch(0.55 0.13 158); }

  /* ── Mensajes de estado ── */
  .fact-success {
    max-width: 980px;
    margin: 0 auto 20px;
    padding: 12px 18px;
    background-color: oklch(0.62 0.13 158 / 0.12);
    border: 1px solid oklch(0.62 0.13 158 / 0.30);
    border-radius: 10px;
    color: oklch(0.62 0.13 158);
    font-size: 13px;
    font-weight: 600;
  }

  .fact-action-error {
    max-width: 980px;
    margin: 0 auto 20px;
    padding: 12px 18px;
    background-color: oklch(0.58 0.20 22 / 0.12);
    border: 1px solid oklch(0.58 0.20 22 / 0.30);
    border-radius: 10px;
    color: oklch(0.72 0.15 22);
    font-size: 13px;
    font-weight: 600;
  }

  /* ── Nota Stripe Connect ── */
  .fact-stripe-note {
    text-align: center;
    font-size: 11.5px;
    color: #444;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .fact-stripe-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: oklch(0.62 0.13 158);
    flex-shrink: 0;
  }

  /* ── Historial de facturas ── */
  .fact-invoices {
    max-width: 980px;
    margin: 36px auto 0;
    background-color: #1a1a1f;
    border: 1px solid #2a2a35;
    border-radius: 16px;
    padding: 24px 28px;
  }

  .fact-invoices-title {
    font-size: 14px;
    font-weight: 700;
    color: #f0f0f5;
    margin: 0 0 20px;
    letter-spacing: -0.2px;
  }

  .fact-invoice-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 0;
    border-bottom: 1px solid #222230;
  }

  .fact-invoice-row:last-child { border-bottom: none; }

  .fact-invoice-period {
    font-size: 13px;
    color: #a0a0b8;
    font-weight: 600;
  }

  .fact-invoice-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .fact-invoice-amount {
    font-size: 14px;
    font-weight: 800;
    color: #f0f0f5;
    font-family: var(--wf-mono, "JetBrains Mono", monospace);
  }

  .fact-chip-pagado {
    background-color: oklch(0.62 0.13 158 / 0.15);
    color: oklch(0.62 0.13 158);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .fact-chip-pendiente {
    background-color: oklch(0.74 0.12 78 / 0.15);
    color: oklch(0.74 0.12 78);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .fact-chip-fallido {
    background-color: oklch(0.58 0.20 22 / 0.15);
    color: oklch(0.72 0.15 22);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .fact-empty {
    text-align: center;
    color: #444;
    font-size: 13px;
    padding: 24px 0;
  }

  .fact-loading {
    text-align: center;
    color: #555;
    font-size: 13px;
    padding: 80px 0;
  }

  .fact-load-error {
    text-align: center;
    color: oklch(0.72 0.15 22);
    font-size: 13px;
    padding: 80px 0;
  }

  /* ── Modal de confirmación de cambio de plan ── */
  .fact-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .fact-modal {
    background-color: #1a1a1f;
    border: 1px solid #2a2a35;
    border-radius: 20px;
    padding: 32px;
    width: 100%;
    max-width: 480px;
    margin: 16px;
  }

  .fact-modal-title {
    font-size: 18px;
    font-weight: 800;
    color: #f0f0f5;
    margin: 0 0 8px;
    letter-spacing: -0.4px;
  }

  .fact-modal-sub {
    font-size: 13px;
    color: #666;
    margin: 0 0 24px;
  }

  .fact-modal-detail {
    background-color: #0e0e12;
    border: 1px solid #1e2030;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    font-size: 13px;
    color: #a0a0b8;
    line-height: 1.6;
  }

  .fact-modal-detail strong { color: #f0f0f5; }

  .fact-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .fact-btn-cancel {
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid #2a2a35;
    background: transparent;
    color: #888;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.14s ease, color 0.14s ease;
  }

  .fact-btn-cancel:hover {
    border-color: #444;
    color: #ccc;
  }

  .fact-btn-confirm {
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    background-color: oklch(0.62 0.13 158);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.14s ease;
  }

  .fact-btn-confirm:hover { background-color: oklch(0.55 0.13 158); }
  .fact-btn-confirm:disabled { opacity: 0.65; cursor: not-allowed; }

  /* ── Indicador de paso ── */
  .fact-step-track {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 28px;
  }

  .fact-step-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .fact-step-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #333;
    background: transparent;
    flex-shrink: 0;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .fact-step-item.active .fact-step-dot {
    border-color: oklch(0.55 0.17 256);
    background-color: oklch(0.55 0.17 256);
  }

  .fact-step-item.done .fact-step-dot {
    border-color: oklch(0.62 0.13 158);
    background-color: oklch(0.62 0.13 158);
  }

  .fact-step-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #444;
    transition: color 0.2s ease;
  }

  .fact-step-item.active .fact-step-label { color: oklch(0.72 0.10 256); }
  .fact-step-item.done  .fact-step-label { color: oklch(0.62 0.13 158); }

  .fact-step-connector {
    flex: 1;
    height: 1px;
    background-color: #2a2a35;
    margin: 0 12px;
  }

  /* ── Formulario de datos de contacto ── */
  .fact-form-group {
    margin-bottom: 16px;
  }

  .fact-form-label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    color: #888;
    letter-spacing: 0.3px;
    margin-bottom: 6px;
    text-transform: uppercase;
  }

  .fact-form-input {
    width: 100%;
    box-sizing: border-box;
    background-color: #0e0e12;
    border: 1px solid #2a2a35;
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 13.5px;
    color: #e8e8ef;
    font-family: var(--wf-sans, "Hanken Grotesk", system-ui, sans-serif);
    outline: none;
    transition: border-color 0.15s ease;
  }

  .fact-form-input::placeholder { color: #3a3a4a; }

  .fact-form-input:focus {
    border-color: oklch(0.55 0.17 256 / 0.7);
    box-shadow: 0 0 0 3px oklch(0.55 0.17 256 / 0.10);
  }

  /* ── Opción de método de pago ── */
  .fact-payment-option {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: #0e0e12;
    border: 1px solid #2a2a35;
    border-radius: 14px;
    padding: 18px 18px;
    cursor: pointer;
    margin-bottom: 24px;
    text-align: left;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .fact-payment-option:not(:disabled):hover {
    border-color: oklch(0.55 0.17 256 / 0.6);
    box-shadow: 0 0 0 3px oklch(0.55 0.17 256 / 0.08);
  }

  .fact-payment-option:disabled { opacity: 0.65; cursor: not-allowed; }

  .fact-payment-option.loading {
    border-color: oklch(0.62 0.13 158 / 0.5);
  }

  .fact-payment-logo-col {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: linear-gradient(135deg, oklch(0.45 0.20 260), oklch(0.38 0.18 280));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .fact-payment-logo-text {
    font-size: 13px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .fact-payment-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .fact-payment-name {
    font-size: 14px;
    font-weight: 700;
    color: #f0f0f5;
  }

  .fact-payment-desc {
    font-size: 11.5px;
    color: #555;
    line-height: 1.4;
  }

  .fact-payment-arrow {
    font-size: 22px;
    color: #444;
    line-height: 1;
    flex-shrink: 0;
  }

  /* ── Opción de simulación sandbox ── */
  .fact-payment-option-sim {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: #0a0e0a;
    border: 1px dashed #2a3530;
    border-radius: 14px;
    padding: 18px 18px;
    cursor: pointer;
    margin-bottom: 24px;
    text-align: left;
    transition: border-color 0.15s ease;
  }

  .fact-payment-option-sim:not(:disabled):hover {
    border-color: oklch(0.62 0.13 158 / 0.5);
  }

  .fact-payment-option-sim:disabled { opacity: 0.65; cursor: not-allowed; }

  .fact-payment-logo-col.sim {
    background: linear-gradient(135deg, oklch(0.35 0.10 158), oklch(0.28 0.08 158));
  }

  @media (max-width: 860px) {
    .fact-wrapper { margin: -34px -20px; padding: 36px 20px 48px; }
    .fact-plans { grid-template-columns: 1fr; max-width: 420px; }
  }
`;
