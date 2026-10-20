// Next.js ejecuta register() una vez al arrancar el servidor.
// Aquí se inicia el consumidor de la cola de auditoría.
// El import va dentro del `if` de NEXT_RUNTIME para que Next lo excluya del bundle edge
// (el consumidor usa módulos de Node como `crypto`).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.AUDIT_POLLER !== 'off') {
    const { iniciarPoller } = await import('./lib/poller');
    iniciarPoller();
  }
}
