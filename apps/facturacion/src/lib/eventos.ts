import {
  COLAS,
  TOPICS,
  drenarSuscripcion,
  logEvent,
  type AuditEvent,
  type Evento,
  type PagoAprobadoPayload,
  type SuscripcionAutorizadaPayload,
} from '@workfolder/utils';
import { supabaseAdmin } from '@/services/supabase';

// ── Suscriptor de facturación (cola `facturacion_eventos`) ────────
// Persiste suscripciones y facturas a partir de los eventos que publica el webhook.
// Cada manejador es idempotente (un reintento no duplica) y lanza error si algo
// falla, así el mensaje no se confirma y vuelve a entregarse.

/** Encola la auditoría con la IP que traía el webhook (aquí no hay request) */
const auditarDesde = (ip: string | null | undefined, event: AuditEvent) =>
  logEvent(supabaseAdmin, { headers: { get: (h) => (h === 'x-forwarded-for' ? ip ?? null : null) } }, event);

const unMesDespues = (desde: string) => {
  const fecha = new Date(desde);
  fecha.setMonth(fecha.getMonth() + 1);
  return fecha;
};

/** Activa o actualiza la suscripción del admin */
async function activarSuscripcion(p: SuscripcionAutorizadaPayload, publicadoEn: string) {
  const { data: existing, error } = await supabaseAdmin
    .from('suscripciones')
    .select('id, plan_id, estado, mp_preapproval_id')
    .eq('admin_id', p.admin_id)
    .maybeSingle();
  if (error) throw new Error(error.message);

  // Ya aplicado (reintento, o la ruta síncrona sync/simular lo guardó antes)
  if (existing && existing.plan_id === p.plan_id && existing.estado === 'activo' && existing.mp_preapproval_id === p.preapproval_id) {
    return;
  }

  const fechaProximoCobro = unMesDespues(publicadoEn).toISOString();
  const { error: writeError } = existing
    ? await supabaseAdmin
        .from('suscripciones')
        .update({
          plan_id: p.plan_id,
          estado: 'activo',
          mp_preapproval_id: p.preapproval_id,
          fecha_proximo_cobro: fechaProximoCobro,
          actualizado_en: new Date().toISOString(),
        })
        .eq('admin_id', p.admin_id)
    : await supabaseAdmin
        .from('suscripciones')
        .insert({
          admin_id: p.admin_id,
          plan_id: p.plan_id,
          estado: 'activo',
          mp_preapproval_id: p.preapproval_id,
          fecha_inicio: publicadoEn,
          fecha_proximo_cobro: fechaProximoCobro,
        });
  if (writeError) throw new Error(writeError.message);

  await auditarDesde(p.ip, {
    evento:   'Modificación',
    accion:   `Suscripción al plan ${p.plan_id} activada por Mercado Pago`,
    user_id:  p.admin_id,
    metadata: { plan_id: p.plan_id, preapproval_id: p.preapproval_id },
  });
}

/** Registra la factura de un pago aprobado */
async function registrarFactura(p: PagoAprobadoPayload, publicadoEn: string) {
  const { data: suscripcion, error } = await supabaseAdmin
    .from('suscripciones')
    .select('id')
    .eq('admin_id', p.admin_id)
    .maybeSingle();
  if (error) throw new Error(error.message);

  // MP puede avisar el pago antes que la preaprobación: sin ack, se reintenta más tarde
  if (!suscripcion) throw new Error(`Aún no existe la suscripción del admin ${p.admin_id}`);

  const { data: yaRegistrada, error: dupError } = await supabaseAdmin
    .from('facturas')
    .select('id')
    .eq('mp_payment_id', p.payment_id)
    .maybeSingle();
  if (dupError) throw new Error(dupError.message);
  if (yaRegistrada) return;

  const periodoFin = unMesDespues(publicadoEn);
  const { error: insertError } = await supabaseAdmin.from('facturas').insert({
    suscripcion_id: suscripcion.id,
    monto: p.monto,
    estado: 'pagado',
    periodo_inicio: publicadoEn.slice(0, 10),
    periodo_fin: periodoFin.toISOString().slice(0, 10),
    mp_payment_id: p.payment_id,
  });
  if (insertError) throw new Error(insertError.message);

  await auditarDesde(p.ip, {
    evento:   'Modificación',
    accion:   `Pago aprobado de ${p.monto} ${p.moneda ?? ''} vía Mercado Pago`,
    user_id:  p.admin_id,
    metadata: { payment_id: p.payment_id, suscripcion_id: suscripcion.id },
  });
}

/** Despacha el evento según su tema. Temas desconocidos se confirman sin hacer nada. */
export async function manejarEvento(evento: Evento) {
  switch (evento.topic) {
    case TOPICS.SUSCRIPCION_AUTORIZADA:
      return activarSuscripcion(evento.payload as unknown as SuscripcionAutorizadaPayload, evento.publicado_en);
    case TOPICS.PAGO_APROBADO:
      return registrarFactura(evento.payload as unknown as PagoAprobadoPayload, evento.publicado_en);
  }
}

/** Procesa la cola de facturación hasta vaciarla */
export const drenarEventos = () => drenarSuscripcion(supabaseAdmin, COLAS.FACTURACION, manejarEvento);
