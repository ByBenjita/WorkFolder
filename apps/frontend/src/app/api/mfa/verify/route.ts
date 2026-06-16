import { NextRequest } from 'next/server';
import { proxyToUsuarios } from '@/app/api/proxy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // Agrega un log para verificar que la ruta se está llamando
    console.log('[verify route] llamado');
  return proxyToUsuarios(req, '/api/mfa/verify', 'POST');
}