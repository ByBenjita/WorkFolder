import { NextRequest } from 'next/server';
import { ok, err, OPTIONS } from '@/lib/response';
import { getSupabaseForUser } from '@/lib/auth';
import { supabaseAdmin } from '@/services/supabase';

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

    const { data: suscripcion } = await supabaseAdmin
      .from('suscripciones')
      .select('id')
      .eq('admin_id', user.id)
      .maybeSingle();

    if (!suscripcion) {
      return ok({ facturas: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('facturas')
      .select('*')
      .eq('suscripcion_id', suscripcion.id)
      .order('creado_en', { ascending: false });

    if (error) throw error;

    return ok({ facturas: data ?? [] });
  } catch (e) {
    console.error('[facturas GET]', e);
    return err('Error al obtener facturas', 500);
  }
}
