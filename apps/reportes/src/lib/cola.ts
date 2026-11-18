import { send } from '@vercel/queue';
import type { EventoNegocio } from '@workfolder/utils';
import { claveDedupe, guardarEvento } from './eventos';

// ── Publicación en Vercel Queues ─────────────────────────────────
// En Vercel (o en local con `vercel env pull`, que trae VERCEL_OIDC_TOKEN) se publica en la cola
// y el consumidor push (src/app/api/queues/*) guarda el evento.
// Sin credenciales de Vercel (desarrollo local simple) se guarda directo, para no depender de la nube.

export const RETENCION_SEGUNDOS = 7 * 24 * 60 * 60; // máximo de Vercel Queues

export type ModoCola = 'vercel' | 'directo';

export function modoCola(): ModoCola {
  const forzado = process.env.REPORTES_COLA;
  if (forzado === 'vercel' || forzado === 'directo') return forzado;
  return process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN ? 'vercel' : 'directo';
}

/** Publica el evento en su tópico. La clave de idempotencia evita duplicados al publicar. */
export async function publicarEvento(e: EventoNegocio): Promise<{ modo: ModoCola; messageId: string | null }> {
  if (modoCola() === 'directo') {
    await guardarEvento(e);
    return { modo: 'directo', messageId: null };
  }

  const { messageId } = await send(e.topico, e, {
    idempotencyKey:   claveDedupe(e).slice(0, 256),
    retentionSeconds: RETENCION_SEGUNDOS,
  });
  return { modo: 'vercel', messageId: messageId ?? null };
}
