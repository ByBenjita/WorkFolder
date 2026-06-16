import { NextRequest } from 'next/server';
import { ok, err, OPTIONS } from '@/lib/response';
import { getSupabaseForUser } from '@/lib/auth';
import { supabaseAdmin } from '@/services/supabase';
import { PLANES, type PlanId } from '@/data/planes';

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

    const { data, error } = await supabaseAdmin
      .from('suscripciones')
      .select('*')
      .eq('admin_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return ok({
        suscripcion: {
          plan_id: 'enterprise' as PlanId,
          estado: 'activo',
          fecha_inicio: new Date().toISOString(),
          fecha_proximo_cobro: null,
        },
      });
    }

    return ok({ suscripcion: data });
  } catch (e) {
    console.error('[suscripcion GET]', e);
    return err('Error al obtener suscripción', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser(req);
    if (!user) return err('No autorizado', 401);

    const body = await req.json();
    const { plan_id } = body as { plan_id: PlanId };

    if (!plan_id || !PLANES.find((p) => p.id === plan_id)) {
      return err('Plan inválido');
    }

    const fechaProximoCobro = new Date();
    fechaProximoCobro.setMonth(fechaProximoCobro.getMonth() + 1);

    const { data: existing } = await supabaseAdmin
      .from('suscripciones')
      .select('id')
      .eq('admin_id', user.id)
      .maybeSingle();

    let result;

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('suscripciones')
        .update({
          plan_id,
          fecha_proximo_cobro: fechaProximoCobro.toISOString(),
          actualizado_en: new Date().toISOString(),
        })
        .eq('admin_id', user.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('suscripciones')
        .insert({
          admin_id: user.id,
          plan_id,
          estado: 'activo',
          fecha_inicio: new Date().toISOString(),
          fecha_proximo_cobro: fechaProximoCobro.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return ok({ suscripcion: result });
  } catch (e) {
    console.error('[suscripcion POST]', e);
    return err('Error al actualizar suscripción', 500);
  }
}
