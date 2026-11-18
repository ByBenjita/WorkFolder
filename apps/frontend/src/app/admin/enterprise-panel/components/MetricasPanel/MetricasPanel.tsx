'use client';

import React, { useMemo, useState } from 'react';
import type { PuntoMinuto } from '@/services/reportesService';
import { metricasStyles } from './MetricasPanel.styles';
import { useMetricasPanel, SERIES, CATEGORIAS, fmt, hora, dinero } from './useMetricasPanel';

const Stat = ({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) => (
  <div className="stat-card">
    <p className="stat-label">{label}</p>
    <p className="stat-value">{value}</p>
    <p className="stat-sub">{sub}</p>
  </div>
);

/** Sección "Métricas Live": eventos de negocio procesados por Vercel Queues */
export default function MetricasPanel() {
  const { datos, loading, error } = useMetricasPanel();

  if (!datos) {
    return (
      <div className="mx">
        <style jsx global>{metricasStyles}</style>
        <h2 className="section-title">Métricas Live</h2>
        <div className="card">
          <p className={`mx-vacio ${error ? 'mx-error' : ''}`}>{loading ? 'Cargando métricas...' : error}</p>
        </div>
      </div>
    );
  }

  const k = datos.kpis;
  const ingresos = Object.entries(k.ingresos);
  const alertas = k.alertas_seguridad_5min;

  return (
    <div className="mx">
      <style jsx global>{metricasStyles}</style>
      <h2 className="section-title">Métricas Live</h2>

      <div className="live-row">
        <span className="live-dot" />
        <span className="text-muted">
          {fmt(datos.total_eventos)} eventos procesados por Vercel Queues
          {datos.ultimo_evento_en ? ` · último ${new Date(datos.ultimo_evento_en).toLocaleTimeString('es-CL')}` : ''}
          {error ? ' · reconectando…' : ''}
        </span>
      </div>

      <section className="mx-stats" aria-label="Indicadores">
        <Stat label="Usuarios activos"     value={fmt(k.usuarios_activos_15min)} sub="últimos 15 min" />
        <Stat label="Inicios de sesión"    value={fmt(k.logins_ok)}             sub={`${fmt(k.logins_fallidos)} fallidos`} />
        <Stat label="Documentos subidos"   value={fmt(k.subidas)}               sub={`${fmt(k.descargas)} descargas`} />
        <Stat
          label="Alertas de seguridad"
          value={fmt(alertas)}
          sub={
            <span className="mx-alerta">
              <span aria-hidden style={{ color: alertas > 0 ? 'var(--wf-danger)' : 'var(--wf-safe)' }}>{alertas > 0 ? '▲' : '●'}</span>
              {alertas > 0 ? 'en los últimos 5 min' : 'sin alertas (5 min)'}
            </span>
          }
        />
        <Stat label="Pagos aprobados" value={fmt(k.pagos_aprobados)} sub={`${fmt(k.suscripciones)} suscripciones`} />
        <Stat
          label="Ingresos"
          value={ingresos.length ? dinero(ingresos[0][1], ingresos[0][0]) : '—'}
          sub={ingresos.length > 1 ? ingresos.slice(1).map(([m, v]) => dinero(v, m)).join(' · ') : 'pagos aprobados'}
        />
      </section>

      <SerieMinutos serie={datos.serie_por_minuto} />

      <div className="mx-grid2">
        <section className="card">
          <h3 className="card-title">Actividad por categoría</h3>
          <p className="mx-sub">Total histórico</p>
          <BarrasCategoria porCategoria={datos.por_categoria} />
        </section>

        <section className="card">
          <h3 className="card-title">Eventos por microservicio</h3>
          <p className="mx-sub">Productor que publicó el evento</p>
          <TablaConteo filas={datos.por_origen} encabezado="Microservicio" />
          {Object.keys(datos.suscripciones_por_plan).length > 0 && (
            <>
              <h3 className="card-title" style={{ marginTop: 20 }}>Suscripciones por plan</h3>
              <p className="mx-sub">Autorizadas por Mercado Pago</p>
              <TablaConteo filas={datos.suscripciones_por_plan} encabezado="Plan" />
            </>
          )}
        </section>
      </div>

      <section className="card">
        <h3 className="card-title">Últimos eventos</h3>
        <p className="mx-sub">Sin datos personales: solo tipo, categoría y origen</p>
        {datos.ultimos.length === 0 ? (
          <p className="mx-vacio">Aún no llegan eventos.</p>
        ) : (
          <div className="mx-scroll">
            <table>
              <thead><tr><th>Hora</th><th>Tópico</th><th>Tipo</th><th>Categoría</th><th>Origen</th></tr></thead>
              <tbody>
                {datos.ultimos.map((e, i) => (
                  <tr key={i}>
                    <td>{new Date(e.ocurrido_en).toLocaleTimeString('es-CL')}</td>
                    <td>{e.topico}</td>
                    <td>{e.tipo}</td>
                    <td>{e.categoria ? CATEGORIAS[e.categoria] ?? e.categoria : '—'}</td>
                    <td>{e.origen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Barras apiladas por minuto ─────────────────────────────────────
const W = 720, H = 220, M = { top: 8, right: 8, bottom: 24, left: 32 };

function SerieMinutos({ serie }: { serie: PuntoMinuto[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [tabla, setTabla] = useState(false);

  const max = useMemo(() => {
    const m = Math.max(1, ...serie.map((p) => p.actividad + p.seguridad + p.pagos));
    const paso = m <= 4 ? 1 : Math.ceil(m / 4);
    return Math.ceil(m / paso) * paso;
  }, [serie]);

  if (serie.length === 0) return null;

  const anchoPlot = W - M.left - M.right;
  const altoPlot  = H - M.top - M.bottom;
  const banda = anchoPlot / serie.length;
  const ancho = Math.max(2, banda - 4);
  const y = (v: number) => (v / max) * altoPlot;
  const ticks = Array.from(new Set([0, Math.round(max / 2), max]));

  return (
    <section className="card">
      <div className="mx-cabecera">
        <div>
          <h3 className="card-title">Eventos por minuto</h3>
          <p className="mx-sub">Últimos {serie.length} minutos · se actualiza cada 5 s</p>
        </div>
        <button className="mx-toggle" onClick={() => setTabla(!tabla)}>{tabla ? 'Ver gráfico' : 'Ver tabla'}</button>
      </div>

      <div className="mx-leyenda">
        {SERIES.map((s) => <span key={s.clave}><i style={{ background: s.color }} />{s.nombre}</span>)}
      </div>

      {tabla ? (
        <div className="mx-scroll">
          <table>
            <thead><tr><th>Minuto</th>{SERIES.map((s) => <th key={s.clave} className="num">{s.nombre}</th>)}</tr></thead>
            <tbody>
              {[...serie].reverse().filter((p) => p.actividad + p.seguridad + p.pagos > 0).map((p) => (
                <tr key={p.minuto}><td>{hora(p.minuto)}</td>{SERIES.map((s) => <td key={s.clave} className="num">{p[s.clave]}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mx-chart" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Eventos por minuto, apilados por actividad, seguridad y pagos">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={W - M.right} y1={M.top + altoPlot - y(t)} y2={M.top + altoPlot - y(t)}
                      stroke={t === 0 ? 'var(--mx-base)' : 'var(--mx-grid)'} strokeWidth={1} />
                <text x={M.left - 6} y={M.top + altoPlot - y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--wf-muted)">{t}</text>
              </g>
            ))}

            {serie.map((p, i) => {
              const x = M.left + i * banda + (banda - ancho) / 2;
              let base = M.top + altoPlot;
              const capas = SERIES.filter((s) => p[s.clave] > 0);
              return (
                <g key={p.minuto} opacity={hover === null || hover === i ? 1 : 0.45}>
                  {capas.map((s, j) => {
                    const h = y(p[s.clave]);
                    base -= h;
                    if (j === capas.length - 1) {
                      return <path key={s.clave} fill={s.color} d={barraRedondeada(x, base, ancho, Math.max(h, 1), Math.min(4, ancho / 2, h))} />;
                    }
                    // 2px de separación con el segmento de arriba
                    return <rect key={s.clave} x={x} y={base + 2} width={ancho} height={Math.max(h - 2, 1)} fill={s.color} />;
                  })}
                  <rect x={M.left + i * banda} y={M.top} width={banda} height={altoPlot} fill="transparent" onMouseEnter={() => setHover(i)} />
                </g>
              );
            })}

            {serie.map((p, i) => (i % 5 === 0 || i === serie.length - 1) && (
              <text key={p.minuto} x={M.left + i * banda + banda / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--wf-muted)">
                {hora(p.minuto)}
              </text>
            ))}
          </svg>

          {hover !== null && serie[hover] && (
            <div className="mx-tooltip" style={{
              left: `${((M.left + hover * banda + banda / 2) / W) * 100}%`,
              transform: hover > serie.length / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            }}>
              <strong>{hora(serie[hover].minuto)}</strong>
              {SERIES.map((s) => (
                <div className="fila" key={s.clave}>
                  <span><i style={{ background: s.color }} />{s.nombre}</span>
                  <span>{serie[hover][s.clave]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Rectángulo con solo las esquinas superiores redondeadas (el extremo del dato) */
function barraRedondeada(x: number, y: number, w: number, h: number, r: number) {
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function BarrasCategoria({ porCategoria }: { porCategoria: Record<string, number> }) {
  const filas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  if (filas.length === 0) return <p className="mx-vacio">Aún no llegan eventos de actividad.</p>;
  const max = filas[0][1];
  return (
    <div className="mx-barras">
      {filas.map(([c, n]) => (
        <div className="mx-barra" key={c} title={`${CATEGORIAS[c] ?? c}: ${fmt(n)}`}>
          <span>{CATEGORIAS[c] ?? c}</span>
          <div className="mx-riel"><div className="mx-relleno" style={{ width: `${(n / max) * 100}%` }} /></div>
          <span className="mx-n">{fmt(n)}</span>
        </div>
      ))}
    </div>
  );
}

function TablaConteo({ filas, encabezado }: { filas: Record<string, number>; encabezado: string }) {
  const entradas = Object.entries(filas).sort((a, b) => b[1] - a[1]);
  if (entradas.length === 0) return <p className="mx-vacio">Sin datos.</p>;
  return (
    <table>
      <thead><tr><th>{encabezado}</th><th className="num">Eventos</th></tr></thead>
      <tbody>{entradas.map(([k, n]) => <tr key={k}><td>{k}</td><td className="num">{fmt(n)}</td></tr>)}</tbody>
    </table>
  );
}
