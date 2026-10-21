// ── Publish/Subscribe con acknowledge (Supabase Queues / pgmq) ────
// Publicar: public.publicar_evento copia el evento a la cola de cada suscriptor.
// Suscribirse: cada microservicio lee SU cola, procesa y archiva (ack).
// Sin ack el mensaje reaparece al vencer el visibility timeout (reintento).

import { safeEqual } from './safeEqual';
import type { RequestConHeaders } from './audit';

export const TOPICS = {
  SUSCRIPCION_AUTORIZADA: 'suscripcion.autorizada',
  PAGO_APROBADO:          'pago.aprobado',
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

/** Colas de cada suscriptor (deben existir en supabase/migrations) */
export const COLAS = {
  FACTURACION: 'facturacion_eventos',
  USUARIOS:    'usuarios_eventos',
} as const;

export const MAX_ENTREGAS = 5; // luego de esto el mensaje se archiva sin procesar (dead-letter)

export interface SuscripcionAutorizadaPayload {
  admin_id:       string;
  plan_id:        string;
  preapproval_id: string;
  origen:         'webhook' | 'sync' | 'simulacion';
  ip?:            string | null;
}

export interface PagoAprobadoPayload {
  admin_id:   string;
  payment_id: string;
  monto:      number;
  moneda:     string | null;
  ip?:        string | null;
}

/** Sobre que publicar_evento arma alrededor del payload */
export interface Evento<P = Record<string, unknown>> {
  evento_id:    string;
  topic:        string;
  payload:      P;
  publicado_en: string;
}

/** Cliente Supabase creado con service_role */
export interface PubSubClient {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
  schema(schema: string): {
    rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
  };
}

/**
 * Publica un evento a todos los suscriptores del tema.
 * A diferencia de logEvent, SÍ lanza error: quien publica debe saber que no se entregó
 * (por ejemplo, el webhook responde 500 para que Mercado Pago reintente).
 */
export async function publicar(client: PubSubClient, topic: Topic, payload: object): Promise<void> {
  const { error } = await client.rpc('publicar_evento', { p_topic: topic, p_payload: payload });
  if (error) throw new Error(`No se pudo publicar ${topic}: ${error.message}`);
}

/** Mensaje tal como lo devuelve pgmq_public.read */
interface QueueMessage {
  msg_id:  number;
  read_ct: number;
  message: Partial<Evento> | null;
}

export interface ResultadoConsumo {
  leidos:      number;
  procesados:  number;
  descartados: number;
  fallidos:    number;
}

/** Procesa un evento. Si lanza, no hay ack y el mensaje se reintenta. */
export type ManejadorEvento = (evento: Evento) => Promise<void>;

async function ack(client: PubSubClient, cola: string, msgId: number) {
  const { error } = await client.schema('pgmq_public').rpc('archive', { queue_name: cola, message_id: msgId });
  if (error) console.error(`[pubsub:${cola}] No se pudo confirmar el mensaje ${msgId}:`, error.message);
}

/** Lee un lote de la cola del suscriptor y confirma cada mensaje procesado. Nunca lanza error. */
export async function consumirLote(
  client: PubSubClient,
  cola: string,
  manejador: ManejadorEvento,
  { batch = 10, visibilidad = 30 } = {}
): Promise<ResultadoConsumo> {
  const resultado: ResultadoConsumo = { leidos: 0, procesados: 0, descartados: 0, fallidos: 0 };

  const { data, error } = await client.schema('pgmq_public').rpc('read', {
    queue_name:    cola,
    sleep_seconds: visibilidad,
    n:             batch,
  });
  if (error) {
    console.error(`[pubsub:${cola}] Error leyendo la cola:`, error.message);
    return resultado;
  }

  const mensajes = (data ?? []) as QueueMessage[];
  resultado.leidos = mensajes.length;

  for (const msg of mensajes) {
    const m = msg.message ?? {};
    if (typeof m.topic !== 'string' || !m.payload || typeof m.payload !== 'object') {
      console.error(`[pubsub:${cola}] Mensaje ${msg.msg_id} inválido, se descarta`);
      await ack(client, cola, msg.msg_id);
      resultado.descartados++;
      continue;
    }
    if (msg.read_ct > MAX_ENTREGAS) {
      console.error(`[pubsub:${cola}] Mensaje ${msg.msg_id} (${m.topic}) superó ${MAX_ENTREGAS} entregas, se archiva como dead-letter`);
      await ack(client, cola, msg.msg_id);
      resultado.descartados++;
      continue;
    }

    try {
      await manejador(m as Evento);
      await ack(client, cola, msg.msg_id);
      resultado.procesados++;
    } catch (e: any) {
      // Sin ack: vuelve a estar visible cuando vence el visibility timeout
      console.error(`[pubsub:${cola}] Falló ${m.topic} (mensaje ${msg.msg_id}, entrega ${msg.read_ct}):`, e?.message ?? e);
      resultado.fallidos++;
    }
  }

  return resultado;
}

/** Vacía la cola procesando lotes hasta que quede vacía (o hasta maxLotes). */
export async function drenarSuscripcion(
  client: PubSubClient,
  cola: string,
  manejador: ManejadorEvento,
  { batch = 10, maxLotes = 10 } = {}
): Promise<ResultadoConsumo> {
  const total: ResultadoConsumo = { leidos: 0, procesados: 0, descartados: 0, fallidos: 0 };
  for (let i = 0; i < maxLotes; i++) {
    const r = await consumirLote(client, cola, manejador, { batch });
    total.leidos      += r.leidos;
    total.procesados  += r.procesados;
    total.descartados += r.descartados;
    total.fallidos    += r.fallidos;
    if (r.leidos < batch || r.fallidos > 0) break;
  }
  return total;
}

/** Protege /api/eventos/procesar: solo cron o servicios internos con EVENTS_WORKER_SECRET */
export function workerEventosAutorizado(req: RequestConHeaders): boolean {
  const secret   = process.env.EVENTS_WORKER_SECRET;
  const recibido = req.headers.get('x-worker-secret');
  if (!secret || !recibido) return false;
  return safeEqual(recibido, secret);
}

declare global {
  // eslint-disable-next-line no-var
  var __pubsubPollers: Map<string, ReturnType<typeof setInterval>> | undefined;
}

/**
 * Consulta la cola cada `intervaloMs` mientras el servidor esté vivo (next dev / next start).
 * En serverless usar el endpoint /api/eventos/procesar desde un cron.
 */
export function iniciarSuscriptor(cola: string, drenar: () => Promise<ResultadoConsumo>, intervaloMs = 5000) {
  const pollers = (globalThis.__pubsubPollers ??= new Map());
  if (pollers.has(cola)) return; // evita duplicados con hot reload

  let ocupado = false;
  pollers.set(cola, setInterval(async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      const r = await drenar();
      if (r.leidos) console.log(`[pubsub:${cola}] Procesados ${r.procesados}/${r.leidos} (descartados: ${r.descartados}, fallidos: ${r.fallidos})`);
    } catch (e: any) {
      console.error(`[pubsub:${cola}] Error en el suscriptor:`, e?.message ?? e);
    } finally {
      ocupado = false;
    }
  }, intervaloMs));

  console.log(`[pubsub:${cola}] Suscriptor iniciado (cada ${intervaloMs} ms)`);
}
