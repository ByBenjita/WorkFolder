import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ok, err, OPTIONS } from '@/lib/response';
import { auditar } from '@/lib/audit';

export { OPTIONS };

export async function POST(req: NextRequest) {
  try {
    const authHeader  = req.headers.get('Authorization') ?? '';
    const accessToken = authHeader.replace('Bearer ', '').trim();
    const { code, refresh_token } = await req.json();

    if (!code || !accessToken || !refresh_token) {
      return err('Datos incompletos');
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Establecer sesión con los tokens del link de recuperación
    const { data: sessionInfo, error: sessionError } = await supabase.auth.setSession({
      access_token:  accessToken,
      refresh_token: refresh_token,
    });

    if (sessionError) {
      console.error('[verify-2fa-reset] setSession:', sessionError.message);
      return err('Sesión inválida', 401);
    }

    // Obtener el factor verificado del usuario
    const { data: mfaData } = await supabase.auth.mfa.listFactors();
    const verifiedFactor = mfaData?.all?.find(
      (f: { factor_type: string; status: string; id: string }) =>
        f.factor_type === 'totp' && f.status === 'verified'
    );

    if (!verifiedFactor) return err('No hay factor 2FA configurado', 404);

    // Verificar el código TOTP → obtiene AAL2
    const { error: mfaError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: verifiedFactor.id,
      code,
    });

    if (mfaError) {
      await auditar(req, {
        evento:  'Seguridad',
        accion:  'Código 2FA incorrecto al recuperar la contraseña',
        user_id: sessionInfo?.user?.id ?? null,
      });
      return err('Código incorrecto o expirado', 401);
    }

    // Devolver el nuevo token AAL2
    const { data: sessionData } = await supabase.auth.getSession();

    return ok({
      message:      '2FA verificado',
      access_token: sessionData.session?.access_token,
    });

  } catch (e) {
    console.error('[verify-2fa-reset]', e);
    return err('Error interno del servidor', 500);
  }
}