import { NextResponse } from 'next/server';

// ── Funciones de respuesta con CORS para las APIs ────────────────────────────────
export const corsHeaders = {
  'Access-Control-Allow-Origin':      'http://localhost:3000',
  'Access-Control-Allow-Methods':     'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':     'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age':           '86400',
};

export const ok = (data: object) =>
  NextResponse.json({ success: true, ...data }, { headers: corsHeaders });

export const err = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status, headers: corsHeaders });

// ── Responde al preflight con 200 ────────────────────────────────
export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}