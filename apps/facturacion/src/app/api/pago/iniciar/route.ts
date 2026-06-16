import { NextRequest } from 'next/server';
import { PreApproval } from 'mercadopago';
import { ok, err, OPTIONS } from '@/lib/response';
import { getSupabaseForUser } from '@/lib/auth';
import { getMpClient } from '@/lib/mercadopago';
import { PLANES, type PlanId } from '@/data/planes';

export { OPTIONS };

async function getAdminUser(req: NextRequest) {
  const client = getSupabaseForUser(req);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  if (user.app_metadata?.role !== 'admin') return null;
  return user;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('[pago/iniciar] MP_ACCESS_TOKEN no configurado en .env.local');
      return err('Pasarela de pago no configurada. Agrega MP_ACCESS_TOKEN al .env.local del microservicio facturacion.', 503);
    }

    const user = await getAdminUser(req);
    if (!user) return err('No autorizado', 401);

    const body = await req.json();
    const { plan_id, payer_email } = body as { plan_id: PlanId; payer_email: string };

    const plan = PLANES.find((p) => p.id === plan_id);
    if (!plan) return err('Plan inválido');

    const currency = process.env.MP_CURRENCY ?? 'USD';
    // CLP usa precio_clp (incluye IVA, sin decimales); USD calcula desde precio_mensual
    const monto = currency === 'CLP'
      ? plan.precio_clp
      : Math.round(plan.precio_mensual * (1 + plan.iva_porcentaje / 100) * 100) / 100;
    const backUrl =
      process.env.MP_BACK_URL ??
      `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/enterprise-panel`;

    const preApproval = new PreApproval(getMpClient());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await preApproval.create({
      body: {
        reason: `WorkFolder ${plan.nombre} - Plan Mensual`,
        back_url: backUrl,
        payer_email: payer_email || user.email!,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: monto,
          currency_id: currency,
        },
        external_reference: `${user.id}|${plan_id}`,
        status: 'pending',
      },
    });

    const r = result as Record<string, unknown>;
    return ok({
      init_point:         r['init_point'],
      sandbox_init_point: r['sandbox_init_point'] ?? null,
      preapproval_id:     r['id'],
    });
  } catch (e: unknown) {
    const detail =
      e instanceof Error
        ? e.message
        : typeof e === 'object'
          ? JSON.stringify(e, null, 2)
          : String(e);
    console.error('[pago/iniciar] Error MP completo:', detail);
    return err(`Error MP: ${detail}`, 500);
  }
}
