import { NextRequest } from 'next/server';
import { getSupabaseForUser } from '@/lib/auth';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

// ── Obtener factor 2FA verificado ───────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseForUser(req);

    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) return err('Error al obtener factores: ' + error.message);

    const verifiedFactor = data?.all?.find(
      (f: { factor_type: string; status: string; id: string }) =>
        f.factor_type === 'totp' && f.status === 'verified'
    );

    if (!verifiedFactor) return err('No hay factor 2FA configurado', 404);

    return ok({ factor_id: verifiedFactor.id });

  } catch (e) {
    return err('Error interno del servidor', 500);
  }
}