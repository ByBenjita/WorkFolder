import { NextRequest } from 'next/server';
import { getSupabaseForUser } from '@/lib/auth';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseForUser(req);

    // Limpiar factores pendientes previos
    const { data: listData } = await supabase.auth.mfa.listFactors();
    const pendingFactor = listData?.all?.find(
      (f: { factor_type: string; status: string; id: string }) =>
        f.factor_type === 'totp' && f.status === 'unverified'
    );
    if (pendingFactor) {
      await supabase.auth.mfa.unenroll({ factorId: pendingFactor.id });
    }

    // Enroll nuevo factor TOTP
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType:   'totp',
      issuer:       'WorkFolder',
      friendlyName: 'Mi Dispositivo Seguro',
    });

    if (error) return err('Error al generar QR: ' + error.message);

    return ok({ factor_id: data.id, qr_code: data.totp.qr_code });

  } catch (e) {
    return err('Error interno del servidor', 500);
  }
}