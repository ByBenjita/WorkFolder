import type { NextRequest } from 'next/server';

/**
 * Agrega a los headers hacia un microservicio la IP del cliente firmada con INTERNAL_PROXY_SECRET.
 * req.ip / x-forwarded-for los fija la plataforma (no el navegador); el microservicio
 * solo confía en x-client-ip si x-internal-secret coincide.
 */
export function agregarIpFirmada(req: NextRequest, headers: Record<string, string>): void {
  const clientIp = req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim();
  const secret   = process.env.INTERNAL_PROXY_SECRET;
  if (!clientIp || !secret) return;

  headers['x-client-ip']       = clientIp;
  headers['x-internal-secret'] = secret;
}
