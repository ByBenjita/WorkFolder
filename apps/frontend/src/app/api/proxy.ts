import { NextRequest, NextResponse } from 'next/server';
import { agregarIpFirmada } from '@/app/api/ipFirmada';

const USUARIOS_API_URL = process.env.USUARIOS_API_URL ?? 'http://localhost:3001';

/**
 * Reenvía el request al microservicio de usuarios (con la IP del cliente firmada)
 * y devuelve la respuesta al cliente.
 */
export const proxyToUsuarios = async (
  req: NextRequest,
  path: string,
  method: 'GET' | 'POST' = 'POST'
): Promise<NextResponse> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Reenviar el Authorization header si existe
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;

    // IP del cliente firmada, para la auditoría
    agregarIpFirmada(req, headers);

    const options: RequestInit = { method, headers };

    if (method === 'POST') {
      const body = await req.json().catch(() => ({}));
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${USUARIOS_API_URL}${path}`, options);
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });

  } catch (e) {
    console.error(`[proxy] Error en ${path}:`, e);
    return NextResponse.json(
      { success: false, message: 'Error al conectar con el servicio de usuarios' },
      { status: 502 }
    );
  }
};