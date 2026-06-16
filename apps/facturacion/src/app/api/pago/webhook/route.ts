import { NextRequest } from 'next/server';
import { PreApproval, Payment } from 'mercadopago';
import { getMpClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/services/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body as { type: string; data?: { id?: unknown } };

    if (type === 'subscription_preapproval' && data?.id) {
      await sincronizarPreapproval(String(data.id));
    } else if (type === 'payment' && data?.id) {
      await registrarPago(String(data.id));
    }

    return new Response(null, { status: 200 });
  } catch (e) {
    console.error('[webhook MP]', e);
    return new Response(null, { status: 200 });
  }
}

async function sincronizarPreapproval(preapprovalId: string) {
  const preApproval = new PreApproval(getMpClient());
  const sub = await preApproval.get({ id: preapprovalId });

  if (!sub.external_reference || sub.status !== 'authorized') return;

  const [adminId, planId] = sub.external_reference.split('|');

  const fechaProximoCobro = new Date();
  fechaProximoCobro.setMonth(fechaProximoCobro.getMonth() + 1);

  const { data: existing } = await supabaseAdmin
    .from('suscripciones')
    .select('id')
    .eq('admin_id', adminId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('suscripciones')
      .update({
        plan_id: planId,
        estado: 'activo',
        mp_preapproval_id: preapprovalId,
        fecha_proximo_cobro: fechaProximoCobro.toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .eq('admin_id', adminId);
  } else {
    await supabaseAdmin
      .from('suscripciones')
      .insert({
        admin_id: adminId,
        plan_id: planId,
        estado: 'activo',
        mp_preapproval_id: preapprovalId,
        fecha_inicio: new Date().toISOString(),
        fecha_proximo_cobro: fechaProximoCobro.toISOString(),
      });
  }
}

async function registrarPago(paymentId: string) {
  const payment = new Payment(getMpClient());
  const pago = await payment.get({ id: paymentId });

  if (pago.status !== 'approved' || !pago.external_reference) return;

  const [adminId] = pago.external_reference.split('|');

  const { data: suscripcion } = await supabaseAdmin
    .from('suscripciones')
    .select('id')
    .eq('admin_id', adminId)
    .maybeSingle();

  if (!suscripcion) return;

  const ahora = new Date();
  const periodoFin = new Date(ahora);
  periodoFin.setMonth(periodoFin.getMonth() + 1);

  await supabaseAdmin.from('facturas').insert({
    suscripcion_id: suscripcion.id,
    monto: pago.transaction_amount ?? 0,
    estado: 'pagado',
    periodo_inicio: ahora.toISOString().slice(0, 10),
    periodo_fin: periodoFin.toISOString().slice(0, 10),
    mp_payment_id: String(paymentId),
  });
}
