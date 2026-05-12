import { NextRequest } from 'next/server';
import { getSupabaseForUser } from '@/lib/auth';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseForUser(req);
    const { error } = await supabase.auth.signOut();

    if (error) return err('Error al cerrar sesión: ' + error.message);

    return ok({ message: 'Sesión cerrada correctamente' });

  } catch (e) {
    return err('Error interno del servidor', 500);
  }
}