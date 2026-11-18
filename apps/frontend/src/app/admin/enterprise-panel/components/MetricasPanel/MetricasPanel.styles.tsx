import css from 'styled-jsx/css';

// Estilos de la sección Métricas Live. Usa los tokens --wf-* del panel enterprise.
// Series: paleta categórica validada (CVD y contraste) para fondo claro.
export const metricasStyles = css.global`
  .mx {
    --mx-serie-1: #2a78d6; /* actividad */
    --mx-serie-2: #eb6834; /* seguridad */
    --mx-serie-3: #1baf7a; /* pagos */
    --mx-grid: #e1e0d9;
    --mx-base: #c3c2b7;
  }

  .mx .mx-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }
  .mx .mx-stats .stat-card { padding: 18px 20px; }
  .mx .mx-stats .stat-value { font-size: 26px; }

  .mx .mx-alerta { display: inline-flex; gap: 5px; align-items: center; }

  .mx .mx-cabecera { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
  .mx .mx-sub { color: var(--wf-muted); font-size: 12.5px; margin: 4px 0 14px; }

  .mx .mx-toggle {
    font: inherit; font-size: 12px; color: var(--wf-ink-2); cursor: pointer;
    background: var(--wf-surface); border: 1px solid var(--wf-line); border-radius: 8px; padding: 5px 10px;
  }
  .mx .mx-toggle:hover { border-color: var(--wf-primary); color: var(--wf-primary-strong); }

  .mx .mx-leyenda { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: var(--wf-ink-2); margin-bottom: 10px; }
  .mx .mx-leyenda span { display: inline-flex; gap: 6px; align-items: center; }
  .mx .mx-leyenda i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }

  .mx .mx-chart { position: relative; }
  .mx .mx-chart svg { display: block; width: 100%; height: auto; }

  .mx .mx-tooltip {
    position: absolute; top: 0; pointer-events: none; z-index: 2; white-space: nowrap;
    background: var(--wf-surface); border: 1px solid var(--wf-line); border-radius: 10px;
    padding: 9px 11px; font-size: 12px; box-shadow: var(--wf-shadow-md); color: var(--wf-ink);
  }
  .mx .mx-tooltip strong { display: block; margin-bottom: 4px; }
  .mx .mx-tooltip .fila { display: flex; justify-content: space-between; gap: 14px; }
  .mx .mx-tooltip i { width: 8px; height: 8px; border-radius: 2px; display: inline-block; margin-right: 6px; }

  .mx .mx-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 20px; }
  .mx .mx-grid2 .card { margin-bottom: 0; min-width: 0; }

  .mx .mx-barras { display: flex; flex-direction: column; gap: 9px; }
  .mx .mx-barra { display: grid; grid-template-columns: 130px 1fr 44px; gap: 10px; align-items: center; font-size: 13px; color: var(--wf-ink-2); }
  .mx .mx-riel { height: 14px; }
  .mx .mx-relleno { height: 100%; background: var(--mx-serie-1); border-radius: 0 4px 4px 0; min-width: 2px; }
  .mx .mx-n { text-align: right; font-variant-numeric: tabular-nums; }

  .mx table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .mx th { text-align: left; font-weight: 600; color: var(--wf-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .6px;
           border-bottom: 1px solid var(--mx-base); padding: 7px 6px; }
  .mx td { border-bottom: 1px solid var(--wf-line-soft); padding: 7px 6px; color: var(--wf-ink-2); font-variant-numeric: tabular-nums; }
  .mx .num { text-align: right; }
  .mx .mx-scroll { overflow-x: auto; }
  .mx .mx-vacio { color: var(--wf-muted); font-size: 13px; padding: 8px 0; margin: 0; }
  .mx .mx-error { color: var(--wf-danger); }

  @media (max-width: 520px) {
    .mx .mx-barra { grid-template-columns: 96px 1fr 36px; }
  }
`;
