import { NextRequest, NextResponse } from 'next/server';
import { ingestaAutorizada } from '@workfolder/utils';
import { validarEvento } from '@/lib/eventos';
import { publicarEvento } from '@/lib/cola';

export const dynamic = 'force-dynamic';

/**
 * POST /api/eventos — puerta de entrada de los microservicios (header x-ingest-secret).
 * Publica el evento en Vercel Queues y responde 202; el consumidor lo procesa después.
 * 503 = no se pudo publicar (el productor lo registra y sigue).
 */
export async function POST(req: NextRequest) {
  if (!ingestaAutorizada(req)) {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'JSON inválido' }, { status: 400 });
  }

  const evento = validarEvento(cuerpo);
  if (!evento) return NextResponse.json({ success: false, message: 'Evento inválido' }, { status: 400 });

  try {
    const r = await publicarEvento(evento);
    return NextResponse.json({ success: true, ...r }, { status: 202 });
  } catch (e: any) {
    console.error('[reportes] No se pudo publicar el evento:', e?.message ?? e);
    return NextResponse.json({ success: false, message: 'No se pudo publicar el evento' }, { status: 503 });
  }
}
