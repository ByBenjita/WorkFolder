import { supabaseAdmin } from '@/services/supabase';

// ── Consumidor de la cola `audit_events` (Supabase Queues / pgmq) ──
// Lee un lote, lo persiste en public.audit_log y archiva cada mensaje.
// Si algo falla, el mensaje no se archiva y vuelve a estar visible cuando
// vence el visibility timeout → reintento automático.

export const AUDIT_QUEUE        = 'audit_events';
export const EVENTOS_VALIDOS    = ['Acceso', 'Subida', 'Modificación', 'Eliminación', 'Seguridad'] as const;
export const MAX_REINTENTOS     = 5;    // luego de esto el mensaje se archiva sin procesar (dead-letter)
const DEFAULT_BATCH             = 20;
const DEFAULT_VISIBILITY_SECS   = 30;

/** Mensaje tal como lo devuelve pgmq_public.read */
export interface QueueMessage {
  msg_id:      number;
  read_ct:     number;
  enqueued_at: string;
  vt:          string;
  message:     Record<string, any>;
}

/** Fila que se inserta en public.audit_log */
export interface AuditRow {
  msg_id:       number;
  evento:       string;
  accion:       string;
  user_id:      string | null;
  user_email:   string | null;
  documento_id: string | null;
  ip:           string | null;
  metadata:     Record<string, unknown>;
  ocurrido_en:  string;
}

/** Contadores de un procesamiento de la cola */
export interface ResultadoLote {
  leidos:      number;
  registrados: number;
  descartados: number;
  fallidos:    number;
}

// Cache simple de emails para no consultar Auth por cada evento
const emailCache = new Map<string, string | null>();

/** Vacía el cache de emails (usado en los tests para aislar cada caso). */
export function limpiarCacheEmails() {
  emailCache.clear();
}

/** Obtiene el email del usuario desde Supabase Auth (con cache). null si no existe o falla. */
async function resolverEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  if (emailCache.has(userId)) return emailCache.get(userId) ?? null;
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = data?.user?.email ?? null;
    emailCache.set(userId, email);
    return email;
  } catch {
    return null;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Devuelve el valor si es un UUID válido; si no, null (las columnas uuid rechazarían el INSERT). */
function uuidONull(valor: unknown): string | null {
  return typeof valor === 'string' && UUID_RE.test(valor) ? valor : null;
}

/**
 * Valida y transforma un mensaje de la cola en una fila de audit_log. null = mensaje inválido.
 * Los ids que no son UUID se guardan como null y el valor recibido (recortado) queda en metadata,
 * para no perder eventos de seguridad con ids manipulados.
 */
export function mensajeAFila(msg: QueueMessage): Omit<AuditRow, 'user_email'> | null {
  const m = msg.message ?? {};
  if (!EVENTOS_VALIDOS.includes(m.evento) || typeof m.accion !== 'string' || !m.accion.trim()) {
    return null;
  }

  const metadata: Record<string, unknown> = m.metadata && typeof m.metadata === 'object' ? { ...m.metadata } : {};
  const userId      = uuidONull(m.user_id);
  const documentoId = uuidONull(m.documento_id);
  if (m.user_id != null && !userId)           metadata.user_id_recibido      = String(m.user_id).slice(0, 100);
  if (m.documento_id != null && !documentoId) metadata.documento_id_recibido = String(m.documento_id).slice(0, 100);

  return {
    msg_id:       msg.msg_id,
    evento:       m.evento,
    accion:       m.accion.slice(0, 500),
    user_id:      userId,
    documento_id: documentoId,
    ip:           m.ip ?? null,
    metadata,
    ocurrido_en:  m.ocurrido_en ?? msg.enqueued_at,
  };
}

/** Archiva el mensaje (sale de la cola y queda copia en pgmq.a_audit_events). true si tuvo éxito. */
async function archivar(msgId: number): Promise<boolean> {
  const { error } = await supabaseAdmin.schema('pgmq_public').rpc('archive', {
    queue_name: AUDIT_QUEUE,
    message_id: msgId,
  });
  if (error) console.error(`[auditoria] No se pudo archivar el mensaje ${msgId}:`, error.message);
  return !error;
}

/** Inserta filas en audit_log. upsert + ignoreDuplicates sobre msg_id: un reproceso no duplica registros. */
async function insertar(filas: AuditRow[]) {
  return supabaseAdmin
    .from('audit_log')
    .upsert(filas, { onConflict: 'msg_id', ignoreDuplicates: true });
}

/** Procesa un lote de la cola. Nunca lanza error. */
export async function procesarLote(
  { batch = DEFAULT_BATCH, visibilidad = DEFAULT_VISIBILITY_SECS } = {}
): Promise<ResultadoLote> {
  const resultado: ResultadoLote = { leidos: 0, registrados: 0, descartados: 0, fallidos: 0 };

  const { data, error } = await supabaseAdmin.schema('pgmq_public').rpc('read', {
    queue_name:    AUDIT_QUEUE,
    sleep_seconds: visibilidad,
    n:             batch,
  });

  if (error) {
    console.error('[auditoria] Error leyendo la cola:', error.message);
    return resultado;
  }

  const mensajes = (data ?? []) as QueueMessage[];
  resultado.leidos = mensajes.length;
  if (!mensajes.length) return resultado;

  // 1) Separar válidos de inválidos
  const validos: { msg: QueueMessage; fila: AuditRow }[] = [];
  for (const msg of mensajes) {
    const base = mensajeAFila(msg);
    if (!base) {
      console.error(`[auditoria] Mensaje ${msg.msg_id} inválido, se archiva sin registrar`);
      await archivar(msg.msg_id);
      resultado.descartados++;
      continue;
    }
    validos.push({ msg, fila: { ...base, user_email: await resolverEmail(base.user_id) } });
  }
  if (!validos.length) return resultado;

  // 2) Intento en lote
  const { error: loteError } = await insertar(validos.map((v) => v.fila));
  if (!loteError) {
    for (const { msg } of validos) await archivar(msg.msg_id);
    resultado.registrados = validos.length;
    return resultado;
  }

  // 3) Si el lote falla, uno por uno para aislar el mensaje problemático
  console.warn('[auditoria] Falló el lote, reintentando uno por uno:', loteError.message);
  for (const { msg, fila } of validos) {
    const { error: filaError } = await insertar([fila]);
    if (!filaError) {
      await archivar(msg.msg_id);
      resultado.registrados++;
    } else if (msg.read_ct >= MAX_REINTENTOS) {
      console.error(`[auditoria] Mensaje ${msg.msg_id} superó ${MAX_REINTENTOS} intentos, se archiva:`, filaError.message);
      await archivar(msg.msg_id);
      resultado.descartados++;
    } else {
      // No se archiva: vuelve a la cola cuando vence el visibility timeout
      resultado.fallidos++;
    }
  }
  return resultado;
}

/** Vacía la cola procesando lotes hasta que quede vacía (o hasta maxLotes). */
export async function drenarCola({ batch = DEFAULT_BATCH, maxLotes = 10 } = {}): Promise<ResultadoLote> {
  const total: ResultadoLote = { leidos: 0, registrados: 0, descartados: 0, fallidos: 0 };
  for (let i = 0; i < maxLotes; i++) {
    const r = await procesarLote({ batch });
    total.leidos      += r.leidos;
    total.registrados += r.registrados;
    total.descartados += r.descartados;
    total.fallidos    += r.fallidos;
    if (r.leidos < batch || r.fallidos > 0) break;
  }
  return total;
}