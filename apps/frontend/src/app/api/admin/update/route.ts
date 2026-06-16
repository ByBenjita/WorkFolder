import { NextRequest } from 'next/server';
import { proxyToUsuarios } from '@/app/api/proxy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return proxyToUsuarios(req, '/api/admin/update', 'POST');
}
