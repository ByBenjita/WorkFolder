import { handleCallback } from '@vercel/queue';
import { procesarMensaje, politicaReintento } from '@/lib/consumidor';

/**
 * Consumidor push del tópico `workfolder-actividad` (consumer group propio).
 * Sin URL pública: solo Vercel Queues puede invocarlo (trigger en vercel.json).
 */
const consumir = handleCallback(procesarMensaje, { retry: politicaReintento });

export async function POST(req: Request) {
  return consumir(req);
}
