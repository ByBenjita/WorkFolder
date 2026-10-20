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
    if (user.app_metadata?.role !== 'admin') return denegarNoAdmin(req, user.id, 'restablecer contraseña');

    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) return err('userId y newPassword son requeridos', 400);
    if (newPassword.length < 6) return err('La contraseña debe tener al menos 6 caracteres', 400);

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('[admin/reset-password]', updateError.message);
      return err('Error al cambiar contraseña', 500);
    }

    const { data: targetData } = await serviceClient.auth.admin.getUserById(userId);
    await auditar(req, {
      evento:   'Modificación',
      accion:   `Restableció la contraseña de ${targetData?.user?.email ?? userId}`,
      user_id:  user.id,
      metadata: { usuario_afectado: userId },
    });

    return ok({ message: 'Contraseña actualizada correctamente.' });

  } catch (e: any) {
    console.error('[admin/reset-password]', e?.message ?? e);
    return err('Error interno del servidor', 500);
  }
}
