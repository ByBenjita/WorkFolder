import { NextRequest, NextResponse } from 'next/server';
import { buildSwaggerSpec } from '../../../lib/swagger';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
  const proto   = request.headers.get('x-forwarded-proto') ?? 'http';
  const host    = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3002';
  const baseUrl = `${proto}://${host}`;
  return NextResponse.json(buildSwaggerSpec(baseUrl), { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
