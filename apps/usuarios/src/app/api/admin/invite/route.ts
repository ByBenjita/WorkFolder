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

    const { email, password, level, permissions, fullName } = await req.json();
    if (!email || !password) return err('email y password son requeridos', 400);

    const appMeta: Record<string, unknown> = { level: level ?? 'estandar', permissions: permissions ?? {} };
    if (level === 'admin_principal' || level === 'admin_delegado') {
      appMeta.role = 'admin';
    }

    const { data, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata:  appMeta,
      user_metadata: { full_name: fullName ?? null },
    });

    if (createError) return err('Error al crear usuario: ' + createError.message, 500);

    return ok({ message: `Usuario ${data.user?.email} creado correctamente.`, userId: data.user?.id });

  } catch (e: any) {
    return err('Error interno: ' + e.message, 500);
  }
}
