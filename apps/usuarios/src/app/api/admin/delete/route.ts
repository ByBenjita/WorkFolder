import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ok, err, OPTIONS } from '@/lib/response';
import { auditar, denegarNoAdmin } from '@/lib/audit';

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
    if (user.app_metadata?.role !== 'admin') return denegarNoAdmin(req, user.id, 'eliminar usuario');

    const { userId } = await req.json();
    if (!userId) return err('userId es requerido', 400);
    if (userId === user.id) return err('No puedes eliminarte a ti mismo', 400);

    // Email antes de eliminar, para que el registro de auditoría sea legible
    const { data: targetData } = await serviceClient.auth.admin.getUserById(userId);
    const targetEmail = targetData?.user?.email ?? userId;

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[admin/delete]', deleteError.message);
      return err('Error al eliminar usuario', 500);
    }

    await auditar(req, {
      evento:   'Eliminación',
      accion:   `Eliminó el usuario ${targetEmail}`,
      user_id:  user.id,
      metadata: { usuario_afectado: userId },
    });

    return ok({ message: 'Usuario eliminado correctamente.' });

  } catch (e: any) {
    console.error('[admin/delete]', e?.message ?? e);
    return err('Error interno del servidor', 500);
  }
}
