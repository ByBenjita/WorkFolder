import { NextRequest } from 'next/server';
import { PreApproval, Payment } from 'mercadopago';
import { TOPICS, getClientIp, publicar } from '@workfolder/utils';
import { getMpClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/services/supabase';

/**
 * Webhook de Mercado Pago (productor).
 * Verifica la notificación contra la API de MP y publica el evento; los suscriptores
 * (facturación, usuarios) lo procesan en segundo plano.
 * - 200 = ack a MP: el evento quedó publicado (o no había nada que hacer).
 * - 500 = sin ack: MP reintenta la notificación.
 */
export async function POST(req: NextRequest) {
  let body: { type?: string; data?: { id?: unknown } };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 200 }); // body inválido: reintentar no lo arregla
  }

  try {
    const { type, data } = body;
    if (type === 'subscription_preapproval' && data?.id) {
      await publicarPreapproval(req, String(data.id));
    } else if (type === 'payment' && data?.id) {
      await publicarPago(req, String(data.id));
    }
    return new Response(null, { status: 200 });
  } catch (e) {
    console.error('[webhook MP]', e);
    return new Response(null, { status: 500 });
  }
}

/** Publica `suscripcion.autorizada` cuando Mercado Pago autoriza la preaprobación */
async function publicarPreapproval(req: NextRequest, preapprovalId: string) {
  const preApproval = new PreApproval(getMpClient());
  const sub = await preApproval.get({ id: preapprovalId });

  if (!sub.external_reference || sub.status !== 'authorized') return;

  const [adminId, planId] = sub.external_reference.split('|');

  await publicar(supabaseAdmin, TOPICS.SUSCRIPCION_AUTORIZADA, {
    admin_id:       adminId,
    plan_id:        planId,
    preapproval_id: preapprovalId,
    origen:         'webhook',
    ip:             getClientIp(req),
  });
}

/** Publica `pago.aprobado` cuando Mercado Pago aprueba un pago */
async function publicarPago(req: NextRequest, paymentId: string) {
  const payment = new Payment(getMpClient());
  const pago = await payment.get({ id: paymentId });

  if (pago.status !== 'approved' || !pago.external_reference) return;

  const [adminId] = pago.external_reference.split('|');

  await publicar(supabaseAdmin, TOPICS.PAGO_APROBADO, {
    admin_id:   adminId,
    payment_id: paymentId,
    monto:      pago.transaction_amount ?? 0,
    moneda:     pago.currency_id ?? null,
    ip:         getClientIp(req),
  });
}
