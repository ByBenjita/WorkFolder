import { NextRequest } from 'next/server';
import { proxyToUsuarios } from '@/app/api/proxy';

export async function POST(req: NextRequest) {
  return proxyToUsuarios(req, '/api/auth/logout', 'POST');
}