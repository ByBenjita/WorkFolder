import { NextRequest, NextResponse } from 'next/server';

const FACTURACION_URL = process.env.FACTURACION_API_URL ?? 'http://localhost:3003';

async function proxy(req: NextRequest, method: string, path: string[]) {
  try {
    const { search } = new URL(req.url);
    const targetUrl = `${FACTURACION_URL}/api/${path.join('/')}${search}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;

    const options: RequestInit = { method, headers };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = await req.text();
    }

    const res = await fetch(targetUrl, options);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[proxy/facturacion]', e);
    return NextResponse.json(
      { success: false, message: 'Error al conectar con el servicio de facturación' },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(req, 'GET', params.path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(req, 'POST', params.path);
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
