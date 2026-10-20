import { NextRequest } from 'next/server';
import { getSupabaseForUser } from '@/lib/auth';
import { ok, err, OPTIONS } from '@/lib/response';
import { auditar } from '@/lib/audit';

export { OPTIONS };

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseForUser(req);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[logout]', error.message);
      return err('Error al cerrar sesión');
    }

    if (user) await auditar(req, { evento: 'Acceso', accion: 'Cerró sesión', user_id: user.id });

    return ok({ message: 'Sesión cerrada correctamente' });

  } catch (e) {
    return err('Error interno del servidor', 500);
  }
}