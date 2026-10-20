import { NextRequest, NextResponse } from 'next/server';
import { agregarIpFirmada } from '@/app/api/ipFirmada';

const DOCUMENTOS_API_URL = process.env.DOCUMENTOS_API_URL ?? 'http://localhost:3002';

/**
 * Reenvía la petición al microservicio de documentos (BFF).
 * Propaga Authorization, x-user-key y la IP del cliente firmada; devuelve JSON o el archivo binario tal cual.
 */
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

    // IP del cliente firmada, para la auditoría
    agregarIpFirmada(req, headers);

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

// Handlers HTTP: cada método delega en el proxy
export async function GET(req: NextRequest)    { return proxyToDocumentos(req, 'GET');    }
export async function POST(req: NextRequest)   { return proxyToDocumentos(req, 'POST');   }
export async function DELETE(req: NextRequest) { return proxyToDocumentos(req, 'DELETE'); }
export async function PATCH(req: NextRequest)  { return proxyToDocumentos(req, 'PATCH');  }