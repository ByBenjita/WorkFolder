import { NextRequest } from 'next/server';
import { PreApproval } from 'mercadopago';
import { ok, err, OPTIONS } from '@/lib/response';
import { getSupabaseForUser } from '@/lib/auth';
import { supabaseAdmin } from '@/services/supabase';
import { getMpClient } from '@/lib/mercadopago';

export { OPTIONS };

async function getAdminUser(req: NextRequest) {
  const client = getSupabaseForUser(req);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== 'admin') return null;
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAdminUser(req);
    if (!user) return err('No autorizado', 401);

    const preapprovalId = new URL(req.url).searchParams.get('preapproval_id');
    if (!preapprovalId) return err('Falta preapproval_id');

    const preApproval = new PreApproval(getMpClient());
    const sub = await preApproval.get({ id: preapprovalId });

    if (!sub.external_reference) return err('Sin referencia externa en MP');

    const [adminId, planId] = sub.external_reference.split('|');

    if (adminId !== user.id) return err('No autorizado', 403);

    if (sub.status !== 'authorized') {
      return ok({ sincronizado: false, estado: sub.status ?? 'desconocido' });
    }

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

    return ok({ sincronizado: true, plan_id: planId, estado: 'activo' });
  } catch (e) {
    console.error('[pago/sync]', e);
    return err('Error al sincronizar con Mercado Pago', 500);
  }
}
