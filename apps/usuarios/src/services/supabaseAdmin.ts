import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | undefined;

/**
 * Cliente con service_role (solo servidor; lo usa la auditoría para encolar eventos).
 * Lazy: se crea en el primer uso y no al importar el módulo (build y tests).
 */
export const getSupabaseAdmin = (): SupabaseClient =>
  (supabaseAdmin ??= createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
  }));
