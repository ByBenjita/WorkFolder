import { drenarCola } from './consumer';

// ── Poller: consulta la cola cada AUDIT_POLL_MS mientras el servidor esté vivo ──
// Pensado para `next dev` / `next start` (proceso persistente).
// En serverless (Vercel) usar POST /api/procesar desde un cron.

declare global {
  // eslint-disable-next-line no-var
  var __auditPoller: ReturnType<typeof setInterval> | undefined;
}

/** Inicia el intervalo que drena la cola. No crea un segundo poller si ya hay uno ni solapa ejecuciones. */
export function iniciarPoller(intervaloMs = Number(process.env.AUDIT_POLL_MS ?? 5000)) {
  if (globalThis.__auditPoller) return; // evita duplicados con hot reload

  let ocupado = false;
  globalThis.__auditPoller = setInterval(async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      const r = await drenarCola();
      if (r.leidos) console.log(`[auditoria] Procesados ${r.registrados}/${r.leidos} eventos (descartados: ${r.descartados}, fallidos: ${r.fallidos})`);
    } catch (e: any) {
      console.error('[auditoria] Error en el poller:', e?.message ?? e);
    } finally {
      ocupado = false;
    }
  }, intervaloMs);

  console.log(`[auditoria] Consumidor de la cola iniciado (cada ${intervaloMs} ms)`);
}

/** Detiene el poller activo, si existe. */
export function detenerPoller() {
  if (globalThis.__auditPoller) clearInterval(globalThis.__auditPoller);
  globalThis.__auditPoller = undefined;
}