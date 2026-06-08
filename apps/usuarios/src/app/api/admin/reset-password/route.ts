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
    if (!userId || !newPassword) return err('userId y newPassword son requeridos', 400);
    if (newPassword.length < 6) return err('La contraseña debe tener al menos 6 caracteres', 400);

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) return err('Error al cambiar contraseña: ' + updateError.message, 500);

    return ok({ message: 'Contraseña actualizada correctamente.' });

  } catch (e: any) {
    return err('Error interno: ' + e.message, 500);
  }
}
