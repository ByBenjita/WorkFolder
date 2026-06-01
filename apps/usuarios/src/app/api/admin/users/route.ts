import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

// ── Listar todos los usuarios (solo admin) ────────────────────────
export async function GET(req: NextRequest) {
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

    if (user.app_metadata?.role !== 'admin') {
      return err('Permisos insuficientes', 403);
    }

    const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
    if (listError) return err('Error al obtener usuarios: ' + listError.message, 500);

    const result = users.map((u) => ({
      id:         u.id,
      email:      u.email ?? '',
      is_admin:   u.app_metadata?.role === 'admin',
      created_at: u.created_at,
    }));

    return ok({ users: result });

  } catch (e: any) {
    return err('Error interno: ' + e.message, 500);
  }
}
