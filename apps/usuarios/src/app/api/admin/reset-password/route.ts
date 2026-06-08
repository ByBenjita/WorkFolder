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

    const { userId, newPassword } = await req.json();
    if (!userId)      return err('userId es requerido', 400);
    if (!newPassword) return err('newPassword es requerido', 400);
    if (newPassword.length < 8) return err('La contraseña debe tener al menos 8 caracteres', 400);

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) return err('Error al restablecer contraseña: ' + updateError.message, 500);

    return ok({ message: 'Contraseña restablecida correctamente.' });

  } catch (e: any) {
    return err('Error interno: ' + e.message, 500);
  }
}
