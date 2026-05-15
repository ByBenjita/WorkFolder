import { NextRequest, NextResponse } from 'next/server';

const DOCUMENTOS_API_URL = process.env.DOCUMENTOS_API_URL ?? 'http://localhost:3002';

const proxyToDocumentos = async (req: NextRequest, method: string) => {
  try {
    const { search } = new URL(req.url);
    const targetUrl = `${DOCUMENTOS_API_URL}/api${search}`;

    const headers: Record<string, string> = {};

    // Reenviar Authorization
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;

    // Reenviar x-user-key para descarga
    const userKey = req.headers.get('x-user-key');
    if (userKey) headers['x-user-key'] = userKey;

    const options: RequestInit = { method, headers };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = req.headers.get('content-type') ?? '';
      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        options.body = formData;
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
    } else {
      const blob = await res.blob();
      return new NextResponse(blob, {
        status: res.status,
        headers: { 'Content-Type': resContentType },
      });
    }

  } catch (e) {
    console.error('[proxy/documentos]', e);
    return NextResponse.json(
      { success: false, error: 'Error al conectar con el servicio de documentos' },
      { status: 502 }
    );
  }
};

export async function GET(req: NextRequest)    { return proxyToDocumentos(req, 'GET');    }
export async function POST(req: NextRequest)   { return proxyToDocumentos(req, 'POST');   }
export async function DELETE(req: NextRequest) { return proxyToDocumentos(req, 'DELETE'); }