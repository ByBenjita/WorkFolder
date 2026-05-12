import { createClient } from '@supabase/supabase-js';
// Carga las variables de entorno para Supabase
const supabaseUrl     = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

// Cliente base — solo para el login (no requiere token de usuario)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
