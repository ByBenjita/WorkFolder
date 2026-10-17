import { NextResponse } from 'next/server';

// ── Funciones de respuesta con CORS para las APIs ────────────────────────────────
const allowedOrigin = process.env.FRONTEND_URL ?? 'http://localhost:3000';

/** Cabeceras CORS de todas las respuestas (única fuente: FRONTEND_URL) */
export const corsHeaders = {
  'Access-Control-Allow-Origin':      allowedOrigin,
  'Access-Control-Allow-Methods':     'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':     'Content-Type, Authorization, x-worker-secret',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age':           '86400',
};

/** Respuesta 200 con `{ success: true, ...data }` y CORS */
export const ok = (data: object) =>
  NextResponse.json({ success: true, ...data }, { headers: corsHeaders });

/** Respuesta de error `{ success: false, message }` con el status indicado y CORS */
export const err = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status, headers: corsHeaders });

// ── Responde al preflight con 200 ────────────────────────────────
export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}