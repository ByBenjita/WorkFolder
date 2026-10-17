import { NextRequest, NextResponse } from 'next/server';

const AUDITORIA_URL = process.env.AUDITORIA_API_URL ?? 'http://localhost:3004';

// Solo se expone la consulta de logs. /api/procesar es interno (cron / worker).
const RUTAS_PERMITIDAS = ['logs'];

/** Reenvía GET /api/auditoria/logs al microservicio de auditoría con el token del usuario. */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const ruta = params.path.join('/');
  if (!RUTAS_PERMITIDAS.includes(ruta)) {
    return NextResponse.json({ success: false, message: 'Ruta no encontrada' }, { status: 404 });
  }

  try {
    const { search } = new URL(req.url);
    const headers: Record<string, string> = {};

    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;

    const res  = await fetch(`${AUDITORIA_URL}/api/${ruta}${search}`, { headers, cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[proxy/auditoria]', e);
    return NextResponse.json(
      { success: false, message: 'Error al conectar con el servicio de auditoría' },
      { status: 502 }
    );
  }
}

/** Responde el preflight CORS. */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}