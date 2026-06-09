import { NextRequest, NextResponse } from 'next/server';

const USUARIOS_URL   = process.env.USUARIOS_API_URL   ?? 'http://localhost:3001';
const DOCUMENTOS_URL = process.env.DOCUMENTOS_API_URL ?? 'http://localhost:3002';

async function proxy(req: NextRequest, method: string, baseUrl: string) {
  try {
    const { search } = new URL(req.url);
    const targetUrl  = `${baseUrl}/api/rrhh${search}`;

    const headers: Record<string, string> = {};
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;

    const options: RequestInit = { method, headers };

    if (['POST', 'PATCH'].includes(method)) {
      const contentType = req.headers.get('content-type') ?? '';
      if (contentType.includes('multipart/form-data')) {
        options.body = await req.formData();
      } else {
        headers['Content-Type'] = 'application/json';
        options.body = await req.text();
      }
    }

    const res = await fetch(targetUrl, options);
    const resContentType = res.headers.get('content-type') ?? '';

    if (resContentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Respuesta binaria (descarga de archivo)
    const blob = await res.blob();
    return new NextResponse(blob, {
      status:  res.status,
      headers: {
        'Content-Type':        resContentType || 'application/octet-stream',
        'Content-Disposition': res.headers.get('Content-Disposition') ?? '',
        'Cache-Control':       'no-store',
      },
    });

  } catch (e) {
    console.error('[proxy/rrhh]', e);
    return NextResponse.json({ error: 'Error al conectar con el servicio' }, { status: 502 });
  }
}

// GET sin ?download → usuarios (lista de documentos con isAdmin)
// GET con ?download=id → documentos (descarga binaria)
export async function GET(req: NextRequest) {
  const isDownload = new URL(req.url).searchParams.has('download');
  return proxy(req, 'GET', isDownload ? DOCUMENTOS_URL : USUARIOS_URL);
}

// POST (subir archivo) → documentos
export async function POST(req: NextRequest) {
  return proxy(req, 'POST', DOCUMENTOS_URL);
}

// PATCH (firmar) → usuarios
export async function PATCH(req: NextRequest) {
  return proxy(req, 'PATCH', USUARIOS_URL);
}

// DELETE (eliminar) → documentos
export async function DELETE(req: NextRequest) {
  return proxy(req, 'DELETE', DOCUMENTOS_URL);
}
