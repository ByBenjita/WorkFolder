import { NextRequest } from 'next/server';
import { workerEventosAutorizado } from '@workfolder/utils';
import { drenarEventos } from '@/lib/eventos';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

/**
 * POST /api/eventos/procesar
 * Procesa la cola `facturacion_eventos` bajo demanda (cron en serverless).
 * Requiere el header `x-worker-secret: <EVENTS_WORKER_SECRET>`.
 */
export async function POST(req: NextRequest) {
  if (!workerEventosAutorizado(req)) return err('No autorizado', 401);

  const resultado = await drenarEventos();
  return ok({ resultado });
}
