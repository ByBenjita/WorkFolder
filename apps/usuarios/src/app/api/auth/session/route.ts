import { NextRequest } from 'next/server';
import { getSupabaseForUser } from '@/lib/auth';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseForUser(req);

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return err('No hay sesión activa', 401);

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    return ok({
      user: {
        id:       user.id,
        email:    user.email,
        is_admin: user.app_metadata?.role === 'admin',
      },
      aal:  {
        current:      aalData?.currentLevel,
        next:         aalData?.nextLevel,
        mfa_complete: aalData?.currentLevel === 'aal2',
      },
    });

  } catch (e) {
    return err('Error interno del servidor', 500);
  }
}