import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { safeEqual } from '@workfolder/utils';

// ── Productor de eventos de auditoría (Supabase Queues / pgmq) ────
// Los eventos se encolan en `audit_events` y los procesa apps/auditoria.
// Nunca se deben incluir claves (userKey, newKey, clave_cifrada) en el mensaje.

export const AUDIT_QUEUE = 'audit_events';

export type AuditEvento = 'Acceso' | 'Subida' | 'Modificación' | 'Eliminación' | 'Seguridad';

export interface AuditEvent {
  evento:        AuditEvento;
  accion:        string;
  user_id:       string | null;
  documento_id?: string | null;
  ip?:           string | null;
  metadata?:     Record<string, unknown>;
}

/**
 * IP real del cliente.
 * Si la petición viene del BFF con el secreto interno válido, usa `x-client-ip`
 * (Vercel reemplaza x-forwarded-for por la IP de la función del BFF).
 * Si no, usa la IP que reporta la plataforma; así nadie puede inyectar una IP falsa.
 */
export function getClientIp(req: NextRequest): string | null {
  const secret   = process.env.INTERNAL_PROXY_SECRET;
  const recibido = req.headers.get('x-internal-secret');
  const clientIp = req.headers.get('x-client-ip');
  if (secret && recibido && clientIp && safeEqual(recibido, secret)) return clientIp.slice(0, 64);

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

/**
 * Encola un evento de auditoría.
 * Nunca lanza error: si la cola falla, la operación principal sigue funcionando.
 */
export async function logEvent(client: SupabaseClient, event: AuditEvent): Promise<void> {
  try {
    const { error } = await client.schema('pgmq_public').rpc('send', {
      queue_name:    AUDIT_QUEUE,
      message:       { ...event, ocurrido_en: new Date().toISOString() },
      sleep_seconds: 0,
    });
    if (error) console.warn('[audit] No se pudo encolar el evento:', error.message);
  } catch (e: any) {
    console.warn('[audit] Error al encolar el evento:', e?.message ?? e);
  }
}