import { NextRequest } from 'next/server';
import { proxyToUsuarios } from '@/app/api/proxy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return proxyToUsuarios(req, '/api/auth/password/verify-2fa', 'POST');
}