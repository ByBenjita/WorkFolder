import {
  COLAS,
  TOPICS,
  drenarSuscripcion,
  type Evento,
  type SuscripcionAutorizadaPayload,
} from '@workfolder/utils';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

// ── Suscriptor de usuarios (cola `usuarios_eventos`) ──────────────
// Refleja el plan contratado en app_metadata.plan del admin, para que viaje en su JWT.
// Idempotente; si lanza error el mensaje no se confirma y vuelve a entregarse.

/** Guarda el plan activo en app_metadata del admin */
async function sincronizarPlan(p: SuscripcionAutorizadaPayload) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(p.admin_id);
  if (error) throw new Error(error.message);

  const user = data?.user;
  if (!user) return; // el admin ya no existe: nada que sincronizar
  if (user.app_metadata?.plan === p.plan_id) return;

  const { error: updateError } = await admin.auth.admin.updateUserById(p.admin_id, {
    app_metadata: { ...user.app_metadata, plan: p.plan_id },
  });
  if (updateError) throw new Error(updateError.message);
}

/** Despacha el evento según su tema. Temas desconocidos se confirman sin hacer nada. */
export async function manejarEvento(evento: Evento) {
  if (evento.topic === TOPICS.SUSCRIPCION_AUTORIZADA) {
    await sincronizarPlan(evento.payload as unknown as SuscripcionAutorizadaPayload);
  }
}

/** Procesa la cola de usuarios hasta vaciarla */
export const drenarEventos = () => drenarSuscripcion(getSupabaseAdmin(), COLAS.USUARIOS, manejarEvento);
