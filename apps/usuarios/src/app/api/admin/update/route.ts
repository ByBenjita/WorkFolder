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

    const { userId, level, permissions, banned, fullName } = await req.json();
    if (!userId) return err('userId es requerido', 400);

    const { data: targetData, error: targetError } = await serviceClient.auth.admin.getUserById(userId);
    if (targetError || !targetData?.user) return err('Usuario no encontrado', 404);

    const existingMeta     = targetData.user.app_metadata ?? {};
    const existingUserMeta = targetData.user.user_metadata ?? {};
    const newRole = (level === 'admin_principal' || level === 'admin_delegado') ? 'admin' : existingMeta.role ?? null;

    const updatedMeta: Record<string, unknown> = { ...existingMeta, level, permissions };
    if (newRole) updatedMeta.role = newRole;
    else delete updatedMeta.role;

    const updatePayload: Record<string, unknown> = {
      app_metadata:  updatedMeta,
      user_metadata: { ...existingUserMeta, full_name: fullName !== undefined ? fullName : existingUserMeta.full_name },
    };

    if (banned) {
      const banUntil = new Date();
      banUntil.setFullYear(banUntil.getFullYear() + 100);
      updatePayload.ban_duration = `${Math.floor((banUntil.getTime() - Date.now()) / 1000)}s`;
    } else {
      updatePayload.ban_duration = 'none';
    }

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, updatePayload as any);
    if (updateError) return err('Error al actualizar usuario: ' + updateError.message, 500);

    return ok({ message: 'Usuario actualizado correctamente.' });

  } catch (e: any) {
    return err('Error interno: ' + e.message, 500);
  }
}
