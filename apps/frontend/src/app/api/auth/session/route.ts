import { NextRequest } from 'next/server';
import { proxyToUsuarios } from '@/app/api/proxy';

export async function GET(req: NextRequest) {
  return proxyToUsuarios(req, '/api/auth/session', 'GET');
}