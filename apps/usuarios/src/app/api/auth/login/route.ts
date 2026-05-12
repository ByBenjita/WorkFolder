import { NextRequest } from 'next/server';
import { supabase } from '@/services/supabase';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return err('Email y contraseña son requeridos');
    }

    // ── Login con Supabase ───────────────────────────────────────
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[login] Error Supabase:', error.message);
      return err('Credenciales incorrectas: ' + error.message, 401);
    }

    if (!data.session) {
      console.error('[login] No se obtuvo sesión');
      return err('No se pudo obtener la sesión', 500);
    }

    // ── Verificar estado MFA con el token del usuario ────────────
    const { createClient } = await import('@supabase/supabase-js');
    const userSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        },
      }
    );

    const { data: mfaData } = await userSupabase.auth.mfa.listFactors();
    const hasVerifiedMFA = mfaData?.all?.some(
      (f: { factor_type: string; status: string }) =>
        f.factor_type === 'totp' && f.status === 'verified'
    ) ?? false;

    return ok({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      mfa: {
        configured: hasVerifiedMFA,
        next_step:  hasVerifiedMFA ? 'verify' : 'setup',
      },
    });

  } catch (e) {
    console.error('[login] Error inesperado:', e);
    return err('Error interno del servidor', 500);
  }
}