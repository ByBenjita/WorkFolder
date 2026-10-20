import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ok, err, OPTIONS } from '@/lib/response';
import { auditar } from '@/lib/audit';

export { OPTIONS };

export async function POST(req: NextRequest) {
  try {
    const authHeader  = req.headers.get('Authorization') ?? '';
    const accessToken = authHeader.replace('Bearer ', '').trim();
    const { password, refresh_token } = await req.json();

    if (!password) return err('La nueva contraseña es requerida');
    if (password.length < 8) return err('La contraseña debe tener al menos 8 caracteres');
    if (!accessToken) return err('Token requerido', 401);

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Establecer sesión AAL2
    const { data: sessionInfo, error: sessionError } = await supabase.auth.setSession({
      access_token:  accessToken,
      refresh_token: refresh_token ?? '',
    });

    if (sessionError) {
      console.error('[reset] setSession error:', sessionError.message);
      return err('Sesión inválida', 401);
    }

    // Actualizar contraseña con sesión AAL2 activa
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('[reset] updateUser error:', error.message);
      return err('Error al actualizar contraseña');
    }

    await auditar(req, {
      evento:  'Modificación',
      accion:  'Cambió su contraseña (recuperación)',
      user_id: sessionInfo?.user?.id ?? null,
    });

    return ok({ message: 'Contraseña actualizada correctamente' });

  } catch (e) {
    console.error('[reset] error:', e);
    return err('Error interno del servidor', 500);
  }
}