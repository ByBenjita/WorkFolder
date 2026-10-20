import { safeEqual } from './safeEqual';

// ── Productor de eventos de auditoría (Supabase Queues / pgmq) ────
// Los microservicios encolan en `audit_events` y apps/auditoria los persiste en audit_log.
// Nunca incluir claves, contraseñas ni tokens en el evento.

export const AUDIT_QUEUE   = 'audit_events';
export const AUDIT_EVENTOS = ['Acceso', 'Subida', 'Modificación', 'Eliminación', 'Seguridad'] as const;

export type AuditEvento = (typeof AUDIT_EVENTOS)[number];

export interface AuditEvent {
  evento:        AuditEvento;
  accion:        string;
  user_id:       string | null;
  documento_id?: string | null;
  metadata?:     Record<string, unknown>;
}

/** Cliente con acceso a pgmq_public (SupabaseClient creado con service_role) */
export interface AuditQueueClient {
  schema(schema: string): {
    rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
}

/** Request mínimo del que se lee la IP (NextRequest lo cumple) */
export interface RequestConHeaders {
  headers: { get(name: string): string | null };
}

/**
 * IP real del cliente.
 * Si la petición viene del BFF con el secreto interno válido, usa `x-client-ip`
 * (Vercel reemplaza x-forwarded-for por la IP de la función del BFF).
 * Si no, usa la IP que reporta la plataforma; así nadie puede inyectar una IP falsa.
 */
export function getClientIp(req: RequestConHeaders): string | null {
  const secret   = process.env.INTERNAL_PROXY_SECRET;
  const recibido = req.headers.get('x-internal-secret');
  const clientIp = req.headers.get('x-client-ip');
  if (secret && recibido && clientIp && safeEqual(recibido, secret)) return clientIp.slice(0, 64);

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

/**
 * Encola un evento de auditoría con la IP del request y la fecha actual.
 * Nunca lanza error: si la cola falla, la operación principal sigue funcionando.
 */
export async function logEvent(client: AuditQueueClient, req: RequestConHeaders, event: AuditEvent): Promise<void> {
  try {
    const { error } = await client.schema('pgmq_public').rpc('send', {
      queue_name:    AUDIT_QUEUE,
      message:       { ...event, ip: getClientIp(req), ocurrido_en: new Date().toISOString() },
      sleep_seconds: 0,
    });
    if (error) console.warn('[audit] No se pudo encolar el evento:', error.message);
  } catch (e: any) {
    console.warn('[audit] Error al encolar el evento:', e?.message ?? e);
  }
}
