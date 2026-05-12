import { NextRequest } from 'next/server';
import { getSupabaseForUser } from '@/lib/auth';
import { ok, err, OPTIONS } from '@/lib/response';

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

    if (error) return err('Código incorrecto o expirado: ' + error.message, 401);

    return ok({ message: '2FA verificado correctamente' });

  } catch (e) {
    return err('Error interno del servidor', 500);
  }
}