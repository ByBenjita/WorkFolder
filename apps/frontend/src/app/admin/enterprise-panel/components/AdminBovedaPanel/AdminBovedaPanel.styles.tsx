import css from 'styled-jsx/css';

export const adminBovedaPanelStyles = css.global`

  /* ── Raiz del panel ── */
  .abp-root {
    margin-top: 32px;
  }

  .abp-desc {
    color: #6b7280;
    font-size: 13px;
    margin-bottom: 20px;
  }

  /* ── Mensajes de estado ── */
  .abp-success-msg {
    background-color: #d1fae5;
    border: 1px solid #6ee7b7;
    color: #065f46;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .abp-error-perm {
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 16px;
  }

  .abp-perm-title {
    color: #92400e;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .abp-perm-text {
    color: #78350f;
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
  }

  .abp-error-generic {
    background-color: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 16px;
  }

  .abp-error-generic p {
    color: #991b1b;
    font-size: 14px;
    margin: 0;
  }

  /* ── Lista de documentos ── */
  .abp-loading-box {
    text-align: center;
    padding: 40px 0;
    color: #6b7280;
    font-size: 14px;
  }

  .abp-empty-box {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
    font-size: 14px;
  }

  .abp-doc-icon {
    background: #f3f4f6;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #6b7280;
  }

  .abp-doc-user-email {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 2px;
  }

  .abp-btn-reset {
    padding: 6px 12px;
    font-size: 13px;
    color: #dc2626;
  }

  /* ── Modal overlay ── */
  .abp-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }

  /* ── Modal box ── */
  .abp-modal-box {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 32px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  }

  /* ── Modal icono ── */
  .abp-modal-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #fce7f3, #fbcfe8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
    margin: 0 auto 16px;
    color: #9d174d;
  }

  /* ── Modal tipografia ── */
  .abp-modal-title {
    color: #111827;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 4px;
  }

  .abp-modal-subtitle {
    color: #6b7280;
    font-size: 12px;
    text-align: center;
    margin-bottom: 4px;
  }

  .abp-modal-desc {
    color: #374151;
    font-size: 13px;
    text-align: center;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .abp-modal-user-email {
    font-size: 12px;
    color: #9ca3af;
  }

  /* ── Modal aviso de accion irreversible ── */
  .abp-modal-warning {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 16px;
    font-size: 12px;
    color: #991b1b;
    line-height: 1.5;
  }

  /* ── Input label ── */
  .abp-input-label {
    display: block;
    color: #374151;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ── Input wrapper ── */
  .abp-input-wrapper {
    position: relative;
    margin-bottom: 8px;
  }

  /* ── Input ── */
  .abp-input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 44px 10px 12px;
    font-size: 14px;
    outline: none;
    color: #111827;
    background-color: #f9fafb;
    transition: border-color 0.15s;
  }

  .abp-input.abp-input-error {
    border-color: #fca5a5;
    background-color: #fef2f2;
  }

  /* ── Boton mostrar/ocultar clave ── */
  .abp-toggle-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    font-size: 14px;
  }

  /* ── Texto de error inline ── */
  .abp-field-error {
    color: #ef4444;
    font-size: 12px;
    margin-bottom: 8px;
  }

  /* ── Acciones del modal ── */
  .abp-modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }

  /* ── Boton cancelar ── */
  .abp-btn-cancel {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background-color: #ffffff;
    color: #6b7280;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .abp-btn-cancel:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  /* ── Boton confirmar (restablecer) ── */
  .abp-btn-confirm {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: none;
    background-color: #dc2626;
    color: #ffffff;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .abp-btn-confirm:hover:not(:disabled) {
    background-color: #b91c1c;
  }

  .abp-btn-confirm:disabled {
    background-color: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;
