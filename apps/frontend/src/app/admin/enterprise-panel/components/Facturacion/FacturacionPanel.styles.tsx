import css from 'styled-jsx/css';


export const facturacionStyles = css.global`
  :root {
    --wf-primary: oklch(0.55 0.17 256);
    --wf-primary-strong: oklch(0.48 0.18 256);
    --wf-primary-soft: oklch(0.95 0.03 256);
    --wf-primary-ring: oklch(0.55 0.17 256 / 0.30);
    --wf-safe: oklch(0.62 0.13 158);
    --wf-safe-strong: oklch(0.52 0.13 158);
    --wf-safe-soft: oklch(0.96 0.04 158);
    --wf-bg: oklch(0.972 0.004 256);
    --wf-surface: #ffffff;
    --wf-surface-2: oklch(0.985 0.003 256);
    --wf-ink: oklch(0.26 0.025 262);
    --wf-ink-2: oklch(0.44 0.02 262);
    --wf-muted: oklch(0.60 0.018 262);
    --wf-faint: oklch(0.72 0.015 262);
    --wf-line: oklch(0.92 0.006 262);
    --wf-line-soft: oklch(0.95 0.005 262);
    --wf-sans: "Hanken Grotesk", system-ui, sans-serif;
    --wf-mono: "JetBrains Mono", monospace;
  }

  /* ── Wrapper claro — cubre el padding de .panel-main ── */
  .fact-wrapper {
    margin: -34px -38px;
    padding: 34px 38px 48px;
    min-height: calc(100% + 68px);
    background-color: var(--wf-bg);
    color: var(--wf-ink);
    font-family: var(--wf-sans);
    -webkit-font-smoothing: antialiased;
  }

  .fact-inner { max-width: 1100px; margin: 0 auto; }

  /* ── Encabezado de página (clase nueva) ── */
  .fact-head {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }

  .fact-page-icon {
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

  .fact-page-title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.7px;
    line-height: 1.1;
    margin: 0;
  }

  .fact-page-sub {
    color: var(--wf-muted);
    font-size: 13.5px;
    margin: 4px 0 0;
  }

  /* ── Banner "Plan actual" (clase nueva) ── */
  .fact-current {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 20px 24px;
    margin-bottom: 30px;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    border-radius: 16px;
    box-shadow: 0 1px 2px oklch(0.4 0.03 262 / 0.05), 0 1px 3px oklch(0.4 0.03 262 / 0.04);
  }

  .fact-current-ic {
    width: 46px;
    height: 46px;
    border-radius: 13px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(150deg, var(--wf-safe), var(--wf-safe-strong));
    box-shadow: 0 6px 14px oklch(0.62 0.13 158 / 0.30);
  }

  .fact-current-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 1.1px;
    text-transform: uppercase;
    color: var(--wf-muted);
  }

  .fact-current-name {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 2px;
  }

  .fact-current-badge {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    background-color: var(--wf-safe-soft);
    color: var(--wf-safe-strong);
    padding: 3px 8px;
    border-radius: 6px;
  }

  .fact-current-meta { margin-left: auto; display: flex; gap: 34px; }
  .fact-current-stat .k {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; color: var(--wf-muted);
  }
  .fact-current-stat .v {
    font-size: 26px; font-weight: 800; letter-spacing: -0.8px; margin-top: 3px;
    font-family: var(--wf-mono);
  }
  .fact-current-stat .v small { font-size: 12px; font-weight: 600; color: var(--wf-muted); }
  .fact-current-stat .v.sans { font-family: var(--wf-sans); }
  .fact-curr-sym {
    font-size: 16px;
    font-weight: 700;
    vertical-align: super;
    letter-spacing: 0;
    color: var(--wf-ink-2);
    margin-right: 1px;
  }

  /* ── Título de sección (plan grid) ── */
  .fact-title {
    text-align: left;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: var(--wf-ink);
    margin: 0 0 18px;
    line-height: 1.2;
  }

  /* ── Grid de planes ── */
  .fact-plans {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    align-items: start;
    margin: 0 0 26px;
  }

  /* ── Tarjeta de plan ── */
  .fact-plan-card {
    position: relative;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    border-radius: 18px;
    padding: 26px 24px 24px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px oklch(0.4 0.03 262 / 0.05);
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }

  .fact-plan-card:hover {
    box-shadow: 0 12px 28px -14px oklch(0.4 0.04 262 / 0.30);
    transform: translateY(-3px);
  }

  /* plan actual = destacado azul + etiqueta flotante */
  .fact-plan-card.current {
    border: 2px solid var(--wf-primary);
    box-shadow: 0 16px 40px -16px var(--wf-primary-ring);
  }

  .fact-plan-card.current::before {
    content: "Tu plan";
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--wf-primary);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 20px;
    box-shadow: 0 6px 14px var(--wf-primary-ring);
    white-space: nowrap;
  }

  /* ── Nombre del plan ── */
  .fact-plan-name {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    margin: 0 0 14px;
    color: var(--wf-muted);
  }

  .fact-plan-name.primary { color: var(--wf-primary); }
  .fact-plan-name.safe    { color: var(--wf-safe-strong); }

  /* ── Precio ── */
  .fact-plan-price { margin-bottom: 20px; }

  .fact-price-main {
    display: block;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -1.4px;
    color: var(--wf-ink);
    line-height: 1;
  }

  .fact-price-iva {
    display: block;
    font-size: 11.5px;
    color: var(--wf-faint);
    margin-top: 7px;
    font-family: var(--wf-mono);
  }

  /* ── Separador ── */
  .fact-separator {
    border: none;
    border-top: 1px solid var(--wf-line-soft);
    margin: 0 0 18px;
  }

  /* ── Lista de características ── */
  .fact-features {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 11px;
  }

  .fact-features li {
    font-size: 13px;
    color: var(--wf-ink-2);
    line-height: 1.4;
    padding-left: 2px;
  }

  /* el primer carácter de cada línea es el ✓ → píntalo verde */
  .fact-features li::first-letter {
    color: var(--wf-safe);
    font-weight: 800;
  }

  /* ── Bloque Módulo RRHH ── */
  .fact-rrhh-block {
    background: linear-gradient(160deg, var(--wf-safe-soft), oklch(0.99 0.01 158));
    border: 1px solid oklch(0.62 0.13 158 / 0.25);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }

  .fact-rrhh-title {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.9px;
    color: var(--wf-safe-strong);
    text-transform: uppercase;
    margin: 0 0 8px;
  }

  .fact-rrhh-extra {
    font-size: 12px;
    color: oklch(0.42 0.06 158);
    margin: 6px 0 0;
    line-height: 1.4;
  }

  /* ── Botones de plan ── */
  .fact-btn {
    width: 100%;
    padding: 13px 16px;
    border-radius: 11px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    margin-top: auto;
    transition: opacity 0.15s ease, transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  }

  .fact-btn:disabled { cursor: not-allowed; }
  .fact-btn:not(:disabled):hover { transform: translateY(-1px); }

  /* plan actual → deshabilitado suave */
  .fact-btn.current {
    background-color: var(--wf-surface-2);
    color: var(--wf-muted);
    border: 1px solid var(--wf-line);
  }

  /* upgrade / contratar (neutral) → oscuro sólido */
  .fact-btn.neutral {
    background-color: var(--wf-ink);
    color: #fff;
  }
  .fact-btn.neutral:not(:disabled):hover {
    background-color: oklch(0.20 0.025 262);
    box-shadow: 0 8px 18px -6px oklch(0.4 0.04 262 / 0.4);
  }

  /* enterprise → verde seguro */
  .fact-btn.safe {
    background-color: var(--wf-safe-strong);
    color: #fff;
    box-shadow: 0 6px 14px oklch(0.52 0.13 158 / 0.30);
  }
  .fact-btn.safe:not(:disabled):hover { background-color: oklch(0.46 0.13 158); }

  /* ── Mensajes de estado ── */
  .fact-success {
    margin: 0 0 20px;
    padding: 12px 18px;
    background-color: var(--wf-safe-soft);
    border: 1px solid oklch(0.62 0.13 158 / 0.30);
    border-radius: 10px;
    color: var(--wf-safe-strong);
    font-size: 13px;
    font-weight: 600;
  }

  .fact-action-error {
    margin: 0 0 20px;
    padding: 12px 18px;
    background-color: oklch(0.58 0.20 22 / 0.08);
    border: 1px solid oklch(0.58 0.20 22 / 0.30);
    border-radius: 10px;
    color: oklch(0.50 0.20 22);
    font-size: 13px;
    font-weight: 600;
  }

  /* ── Nota de pagos Mercado Pago ── */
  .fact-stripe-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    text-align: center;
    font-size: 12.5px;
    color: var(--wf-muted);
    margin: 0;
    padding: 16px;
  }

  .fact-stripe-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--wf-safe);
    box-shadow: 0 0 0 0 oklch(0.62 0.13 158 / 0.5);
    animation: fact-pulse 2s infinite;
    flex-shrink: 0;
  }

  @keyframes fact-pulse {
    0%, 100% { box-shadow: 0 0 0 0 oklch(0.62 0.13 158 / 0.5); }
    50%      { box-shadow: 0 0 0 6px oklch(0.62 0.13 158 / 0); }
  }

  /* ── Historial de facturas ── */
  .fact-invoices {
    margin: 30px 0 0;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    border-radius: 16px;
    padding: 22px 26px;
    box-shadow: 0 1px 2px oklch(0.4 0.03 262 / 0.05);
  }

  .fact-invoices-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--wf-ink);
    margin: 0 0 16px;
    letter-spacing: -0.2px;
  }

  .fact-invoice-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--wf-line-soft);
  }

  .fact-invoice-row:last-child { border-bottom: none; }

  .fact-invoice-period {
    font-size: 13px;
    color: var(--wf-ink-2);
    font-weight: 600;
    text-transform: capitalize;
  }

  .fact-invoice-right { display: flex; align-items: center; gap: 14px; }

  .fact-invoice-amount {
    font-size: 14px;
    font-weight: 800;
    color: var(--wf-ink);
    font-family: var(--wf-mono);
  }

  .fact-chip-pagado {
    background-color: var(--wf-safe-soft);
    color: var(--wf-safe-strong);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .fact-chip-pendiente {
    background-color: oklch(0.96 0.05 86);
    color: oklch(0.55 0.12 70);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .fact-chip-fallido {
    background-color: oklch(0.96 0.03 22);
    color: oklch(0.50 0.20 22);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .fact-empty {
    text-align: center;
    color: var(--wf-faint);
    font-size: 13px;
    padding: 24px 0;
  }

  .fact-loading {
    text-align: center;
    color: var(--wf-muted);
    font-size: 13px;
    padding: 80px 0;
  }

  .fact-load-error {
    text-align: center;
    color: oklch(0.50 0.20 22);
    font-size: 13px;
    padding: 80px 0;
  }

  /* ── Modal de confirmación de cambio de plan ── */
  .fact-overlay {
    position: fixed;
    inset: 0;
    background-color: oklch(0.26 0.025 262 / 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .fact-modal {
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    border-radius: 20px;
    padding: 30px;
    width: 100%;
    max-width: 480px;
    margin: 16px;
    box-shadow: 0 30px 70px -20px oklch(0.26 0.04 262 / 0.40);
  }

  .fact-modal-title {
    font-size: 19px;
    font-weight: 800;
    color: var(--wf-ink);
    margin: 0 0 8px;
    letter-spacing: -0.4px;
  }

  .fact-modal-sub {
    font-size: 13px;
    color: var(--wf-muted);
    margin: 0 0 24px;
  }

  .fact-modal-sub strong { color: var(--wf-ink) !important; font-weight: 700; }

  .fact-modal-detail {
    background-color: var(--wf-surface-2);
    border: 1px solid var(--wf-line);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    font-size: 13px;
    color: var(--wf-ink-2);
    line-height: 1.6;
  }

  .fact-modal-detail strong { color: var(--wf-ink); }

  .fact-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .fact-btn-cancel {
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid var(--wf-line);
    background: var(--wf-surface);
    color: var(--wf-ink-2);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.14s ease, color 0.14s ease, background 0.14s ease;
  }

  .fact-btn-cancel:hover {
    border-color: var(--wf-faint);
    background-color: var(--wf-surface-2);
    color: var(--wf-ink);
  }

  .fact-btn-confirm {
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    background-color: var(--wf-primary);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 14px var(--wf-primary-ring);
    transition: background-color 0.14s ease;
  }

  .fact-btn-confirm:hover { background-color: var(--wf-primary-strong); }
  .fact-btn-confirm:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }

  /* ── Indicador de paso ── */
  .fact-step-track {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 26px;
  }

  .fact-step-item { display: flex; align-items: center; gap: 8px; }

  .fact-step-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--wf-line);
    background: var(--wf-surface);
    flex-shrink: 0;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .fact-step-item.active .fact-step-dot {
    border-color: var(--wf-primary);
    background-color: var(--wf-primary);
  }

  .fact-step-item.done .fact-step-dot {
    border-color: var(--wf-safe);
    background-color: var(--wf-safe);
  }

  .fact-step-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--wf-faint);
    transition: color 0.2s ease;
  }

  .fact-step-item.active .fact-step-label { color: var(--wf-primary); }
  .fact-step-item.done  .fact-step-label { color: var(--wf-safe-strong); }

  .fact-step-connector {
    flex: 1;
    height: 1px;
    background-color: var(--wf-line);
    margin: 0 12px;
  }

  /* ── Formulario de datos de contacto ── */
  .fact-form-group { margin-bottom: 16px; }

  .fact-form-label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--wf-muted);
    letter-spacing: 0.3px;
    margin-bottom: 6px;
    text-transform: uppercase;
  }

  .fact-form-input {
    width: 100%;
    box-sizing: border-box;
    background-color: var(--wf-surface-2);
    border: 1px solid var(--wf-line);
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 13.5px;
    color: var(--wf-ink);
    font-family: var(--wf-sans);
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .fact-form-input::placeholder { color: var(--wf-faint); }

  .fact-form-input:focus {
    border-color: var(--wf-primary);
    box-shadow: 0 0 0 3px var(--wf-primary-ring);
  }

  /* ── Opción de método de pago ── */
  .fact-payment-option {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: var(--wf-surface);
    border: 1px solid var(--wf-line);
    border-radius: 14px;
    padding: 16px 18px;
    cursor: pointer;
    margin-bottom: 14px;
    text-align: left;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .fact-payment-option:not(:disabled):hover {
    border-color: var(--wf-primary);
    box-shadow: 0 0 0 3px var(--wf-primary-ring);
  }

  .fact-payment-option:disabled { opacity: 0.65; cursor: not-allowed; }
  .fact-payment-option.loading { border-color: var(--wf-safe); }

  .fact-payment-logo-col {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: linear-gradient(135deg, oklch(0.65 0.16 235), oklch(0.55 0.17 250));
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

  .fact-payment-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }

  .fact-payment-name { font-size: 14px; font-weight: 700; color: var(--wf-ink); }

  .fact-payment-desc { font-size: 11.5px; color: var(--wf-muted); line-height: 1.4; }

  .fact-payment-arrow {
    font-size: 22px;
    color: var(--wf-faint);
    line-height: 1;
    flex-shrink: 0;
  }

  /* ── Opción de simulación sandbox ── */
  .fact-payment-option-sim {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: var(--wf-safe-soft);
    border: 1px dashed oklch(0.62 0.13 158 / 0.40);
    border-radius: 14px;
    padding: 16px 18px;
    cursor: pointer;
    margin-bottom: 14px;
    text-align: left;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .fact-payment-option-sim:not(:disabled):hover {
    border-color: var(--wf-safe);
    box-shadow: 0 0 0 3px oklch(0.62 0.13 158 / 0.12);
  }

  .fact-payment-option-sim:disabled { opacity: 0.65; cursor: not-allowed; }

  .fact-payment-logo-col.sim {
    background: linear-gradient(135deg, var(--wf-safe), var(--wf-safe-strong));
  }

  @media (max-width: 1080px) {
    .fact-plans { grid-template-columns: 1fr; max-width: 440px; margin-left: auto; margin-right: auto; }
    .fact-current-meta { display: none; }
  }

  @media (max-width: 860px) {
    .fact-wrapper { margin: -34px -20px; padding: 28px 20px 40px; }
  }
`;
