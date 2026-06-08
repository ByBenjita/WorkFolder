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

    const { email, password, level, permissions } = await req.json();
    if (!email)    return err('email es requerido', 400);
    if (!password) return err('contraseña es requerida', 400);
    if (password.length < 8) return err('La contraseña debe tener al menos 8 caracteres', 400);

    const appMeta = {
      role:        level === 'admin_principal' ? 'admin' : 'user',
      level:       level ?? 'estandar',
      permissions: permissions ?? { create_users: false, view_audit: false, manage_billing: false },
    };

    const { data, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata:  appMeta,
    });

    if (createError) return err('Error al crear usuario: ' + createError.message, 500);

    return ok({ message: `Usuario ${email} creado correctamente.`, userId: data?.user?.id });

  } catch (e: any) {
    return err('Error interno: ' + e.message, 500);
  }
}
