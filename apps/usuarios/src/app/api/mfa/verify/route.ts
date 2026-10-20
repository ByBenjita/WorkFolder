import { NextRequest } from 'next/server';
import { getSupabaseForUser } from '@/lib/auth';
import { ok, err, OPTIONS } from '@/lib/response';
import { auditar } from '@/lib/audit';

export { OPTIONS };

// ── Verificar código 2FA ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseForUser(req);
    const { factor_id, code } = await req.json();

    if (!factor_id || !code) {
      return err('factor_id y code son requeridos');
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor_id,
      code,
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (error) {
      await auditar(req, { evento: 'Seguridad', accion: 'Código 2FA incorrecto', user_id: user?.id ?? null });
      return err('Código incorrecto o expirado', 401);
    }

    await auditar(req, { evento: 'Acceso', accion: 'Verificó su código 2FA', user_id: user?.id ?? null });

    return ok({ message: '2FA verificado correctamente' });

  } catch (e) {
    return err('Error interno del servidor', 500);
  }
}