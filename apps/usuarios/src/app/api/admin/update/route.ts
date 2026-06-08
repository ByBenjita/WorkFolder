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

    const { userId, level, permissions, banned } = await req.json();
    if (!userId) return err('userId es requerido', 400);
    if (userId === user.id) return err('No puedes modificar tu propio acceso desde aqui', 400);

    const { data: targetData, error: targetError } = await serviceClient.auth.admin.getUserById(userId);
    if (targetError || !targetData?.user) return err('Usuario no encontrado', 404);

    const newMeta = {
      ...targetData.user.app_metadata,
      role:        level === 'admin_principal' ? 'admin' : 'user',
      level:       level,
      permissions: permissions,
    };

    const updatePayload: Record<string, unknown> = { app_metadata: newMeta };

    // Banear (deshabilitar) o desbanear
    if (banned === true)  updatePayload.ban_duration = '876600h';
    if (banned === false) updatePayload.ban_duration = 'none';

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, updatePayload as any);
    if (updateError) return err('Error al actualizar usuario: ' + updateError.message, 500);

    return ok({ message: 'Usuario actualizado correctamente.' });

  } catch (e: any) {
    return err('Error interno: ' + e.message, 500);
  }
}
