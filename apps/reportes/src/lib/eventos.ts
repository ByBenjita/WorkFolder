import { TOPICOS_NEGOCIO, TOPICS, type EventoNegocio, type TopicoNegocio } from '@workfolder/utils';
import { supabaseAdmin } from '@/services/supabase';

// ── Validación y persistencia de eventos de negocio ──────────────

const TOPICOS = Object.values(TOPICOS_NEGOCIO) as string[];
const texto = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/** Valida el cuerpo recibido (de un microservicio o de la cola). null si no sirve. */
export function validarEvento(v: unknown): EventoNegocio | null {
  if (!v || typeof v !== 'object') return null;
  const e = v as Record<string, unknown>;

  const evento_id = texto(e.evento_id, 100);
  const tipo      = texto(e.tipo, 100);
  const origen    = texto(e.origen, 100);
  const topico    = typeof e.topico === 'string' && TOPICOS.includes(e.topico) ? (e.topico as TopicoNegocio) : null;
  const fecha     = typeof e.ocurrido_en === 'string' ? Date.parse(e.ocurrido_en) : NaN;
  const datos     = e.datos && typeof e.datos === 'object' && !Array.isArray(e.datos) ? (e.datos as Record<string, unknown>) : null;

  if (!evento_id || !tipo || !origen || !topico || Number.isNaN(fecha) || !datos) return null;
  return { evento_id, topico, tipo, origen, ocurrido_en: new Date(fecha).toISOString(), clave: texto(e.clave, 200), datos };
}

/**
 * Clave de idempotencia de punta a punta:
 * - pagos: tipo + id de Mercado Pago (MP reintenta webhooks y cada reintento trae un evento_id nuevo)
 * - actividad: el evento_id que generó el productor
 */
export function claveDedupe(e: EventoNegocio): string {
  return e.topico === TOPICOS_NEGOCIO.PAGOS && e.clave ? `${e.tipo}:${e.clave}` : e.evento_id;
}

/** Fila de public.metricas_evento. Solo campos conocidos: nada de datos personales. */
export function aFila(e: EventoNegocio) {
  const d = e.datos;
  const esPago = e.topico === TOPICOS_NEGOCIO.PAGOS;
  const monto  = Number(d.monto);
  return {
    dedupe_key:  claveDedupe(e),
    topico:      e.topico,
    tipo:        e.tipo,
    categoria:   esPago ? null : texto(d.categoria, 50),
    origen:      e.origen,
    user_id:     texto(esPago ? d.admin_id : d.user_id, 100),
    monto:       esPago && e.tipo === TOPICS.PAGO_APROBADO && Number.isFinite(monto) ? monto : null,
    moneda:      esPago ? texto(d.moneda, 10) : null,
    plan_id:     esPago ? texto(d.plan_id, 50) : null,
    ocurrido_en: e.ocurrido_en,
  };
}

/**
 * Guarda el evento. Idempotente: un reenvío de la cola (entrega al menos una vez)
 * choca con dedupe_key y se ignora. Lanza error para que la cola reintente.
 */
export async function guardarEvento(e: EventoNegocio): Promise<void> {
  const { error } = await supabaseAdmin
    .from('metricas_evento')
    .upsert(aFila(e), { onConflict: 'dedupe_key', ignoreDuplicates: true });
  if (error) throw new Error(`No se pudo guardar el evento ${e.evento_id}: ${error.message}`);
}
