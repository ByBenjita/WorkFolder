import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Carga las variables de entorno para Supabase (asegúrarse de que estén definidas)
const supabaseUrl     = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

/**
 * Crea un cliente Supabase autenticado con el token del request.
 * Así cada operación se ejecuta en nombre del usuario correcto.
 */
export const getSupabaseForUser = (req: NextRequest) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
};