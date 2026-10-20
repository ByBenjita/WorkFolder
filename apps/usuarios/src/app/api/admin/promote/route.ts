import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ok, err, OPTIONS } from '@/lib/response';
import { auditar, denegarNoAdmin } from '@/lib/audit';

export { OPTIONS };

// ── Promover usuario a administrador (solo admin) ─────────────────
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

    if (user.app_metadata?.role !== 'admin') return denegarNoAdmin(req, user.id, 'promover a administrador');

    const { userId } = await req.json();
    if (!userId) return err('userId es requerido', 400);

    if (userId === user.id) {
      return err('No puedes modificar tu propio rol desde aqui', 400);
    }

    const { data: targetData, error: targetError } = await serviceClient.auth.admin.getUserById(userId);
    if (targetError || !targetData?.user) return err('Usuario no encontrado', 404);

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
      app_metadata: { ...targetData.user.app_metadata, role: 'admin' },
    });

    if (updateError) {
      console.error('[admin/promote]', updateError.message);
      return err('Error al promover usuario', 500);
    }

    await auditar(req, {
      evento:   'Modificación',
      accion:   `Promovió a administrador a ${targetData.user.email}`,
      user_id:  user.id,
      metadata: { usuario_afectado: userId },
    });

    return ok({ message: `Usuario ${targetData.user.email} ahora es administrador.` });

  } catch (e: any) {
    console.error('[admin/promote]', e?.message ?? e);
    return err('Error interno del servidor', 500);
  }
}
