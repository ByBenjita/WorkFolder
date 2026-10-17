// Next.js ejecuta register() una vez al arrancar el servidor.
// Aquí se inicia el consumidor de la cola de auditoría.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.AUDIT_POLLER === 'off') return;

  const { iniciarPoller } = await import('./lib/poller');
  iniciarPoller();
}