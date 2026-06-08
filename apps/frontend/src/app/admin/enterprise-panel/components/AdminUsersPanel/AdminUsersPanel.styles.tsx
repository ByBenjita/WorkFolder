import css from 'styled-jsx/css';

export const adminUsersPanelStyles = css.global`
  .aup-drawer {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    z-index: 201;
    width: 360px;
    background-color: var(--wf-surface);
    border-left: 1px solid var(--wf-line);
    box-shadow: -8px 0 32px rgba(0,0,0,0.10);
    overflow-y: auto;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .aup-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background-color: rgba(0,0,0,0.18);
    backdrop-filter: blur(2px);
    pointer-events: none;
  }
`;
