import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token      = authHeader.replace('Bearer ', '').trim();
    if (!token) return err('No autorizado', 401);

    const serviceClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !user) return err('No autorizado', 401);
    if (user.app_metadata?.role !== 'admin') return err('Permisos insuficientes', 403);

    const { userId } = await req.json();
    if (!userId) return err('userId es requerido', 400);
    if (userId === user.id) return err('No puedes eliminarte a ti mismo', 400);

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) return err('Error al eliminar usuario: ' + deleteError.message, 500);

    return ok({ message: 'Usuario eliminado correctamente.' });

  } catch (e: any) {
    return err('Error interno: ' + e.message, 500);
  }
}
