import { NextRequest } from 'next/server';
import { ok, err, OPTIONS } from '@/lib/response';
import { getSupabaseForUser } from '@/lib/auth';
import { supabaseAdmin } from '@/services/supabase';
import { isSandbox } from '@/lib/mercadopago';
import { PLANES, type PlanId } from '@/data/planes';

export { OPTIONS };

async function getAdminUser(req: NextRequest) {
  const client = getSupabaseForUser(req);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== 'admin') return null;
  return user;
}

export async function POST(req: NextRequest) {
  if (!isSandbox()) {
    return err('Simulación solo disponible en sandbox', 403);
  }

  const user = await getAdminUser(req);
  if (!user) return err('No autorizado', 401);

  const { plan_id } = await req.json() as { plan_id: PlanId };
  const plan = PLANES.find((p) => p.id === plan_id);
  if (!plan) return err('Plan inválido');

  const fechaProximoCobro = new Date();
  fechaProximoCobro.setMonth(fechaProximoCobro.getMonth() + 1);

  const fakePreapprovalId = `SANDBOX-SIM-${Date.now()}`;

  const { data: existing } = await supabaseAdmin
    .from('suscripciones')
    .select('id')
    .eq('admin_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('suscripciones')
      .update({
        plan_id,
        estado: 'activo',
        mp_preapproval_id: fakePreapprovalId,
        fecha_proximo_cobro: fechaProximoCobro.toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .eq('admin_id', user.id);
  } else {
    await supabaseAdmin
      .from('suscripciones')
      .insert({
        admin_id: user.id,
        plan_id,
        estado: 'activo',
        mp_preapproval_id: fakePreapprovalId,
        fecha_inicio: new Date().toISOString(),
        fecha_proximo_cobro: fechaProximoCobro.toISOString(),
      });
  }

  return ok({ simulado: true, plan_id, estado: 'activo' });
}
