import { NextRequest } from 'next/server';
import { isWorkerAuthorized } from '@/lib/auth';
import { drenarCola } from '@/lib/consumer';
import { ok, err } from '@/lib/response';

export { OPTIONS } from '@/lib/response';

/**
 * POST /api/procesar
 * Procesa la cola bajo demanda. Útil en serverless (Vercel Cron) o para forzar
 * el procesamiento. Requiere el header `x-worker-secret: <AUDIT_WORKER_SECRET>`.
 */
export async function POST(req: NextRequest) {
  if (!isWorkerAuthorized(req)) return err('No autorizado', 401);

  const resultado = await drenarCola();
  return ok({ resultado });
}