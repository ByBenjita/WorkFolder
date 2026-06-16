import { NextResponse } from 'next/server';

const allowedOrigin = process.env.FRONTEND_URL ?? 'http://localhost:3000';

export const corsHeaders = {
  'Access-Control-Allow-Origin':      allowedOrigin,
  'Access-Control-Allow-Methods':     'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':     'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age':           '86400',
};

export const ok = (data: object) =>
  NextResponse.json({ success: true, ...data }, { headers: corsHeaders });

export const err = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status, headers: corsHeaders });

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
