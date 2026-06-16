import { NextRequest } from 'next/server';
import { proxyToUsuarios } from '@/app/api/proxy';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return proxyToUsuarios(req, '/api/mfa/factor', 'GET');
}