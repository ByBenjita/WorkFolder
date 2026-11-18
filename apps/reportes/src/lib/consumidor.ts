import type { MessageMetadata, RetryDirective } from '@vercel/queue';
import { validarEvento, guardarEvento } from './eventos';

// ── Consumidor push de Vercel Queues ─────────────────────────────
// Vercel invoca las rutas de src/app/api/queues/* por cada mensaje (ver vercel.json).
// Terminar sin error = ack. Lanzar = reintento con backoff.

export const MAX_ENTREGAS = 10;

/** Procesa un mensaje de la cola */
export async function procesarMensaje(mensaje: unknown, metadata: MessageMetadata): Promise<void> {
  const evento = validarEvento(mensaje);
  if (!evento) {
    // Reintentar no lo arregla: se confirma (ack) y se descarta
    console.error(`[reportes:${metadata.topicName}] Mensaje ${metadata.messageId} inválido, se descarta`);
    return;
  }
  await guardarEvento(evento);
}

/** Backoff exponencial (5 s, 10 s, 20 s... máx 5 min). Tras MAX_ENTREGAS se descarta (dead-letter). */
export function politicaReintento(error: unknown, metadata: MessageMetadata): RetryDirective {
  if (metadata.deliveryCount >= MAX_ENTREGAS) {
    console.error(`[reportes:${metadata.topicName}] Mensaje ${metadata.messageId} descartado tras ${metadata.deliveryCount} entregas:`, error);
    return { acknowledge: true };
  }
  return { afterSeconds: Math.min(300, 2 ** metadata.deliveryCount * 5) };
}
