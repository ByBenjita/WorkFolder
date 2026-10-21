// Next.js ejecuta register() una vez al arrancar el servidor.
// Aquí se inicia el suscriptor de la cola `usuarios_eventos`.
// El import va dentro del `if` de NEXT_RUNTIME para que Next lo excluya del bundle edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.EVENTS_POLLER !== 'off') {
    const { iniciarSuscriptor, COLAS } = await import('@workfolder/utils');
    const { drenarEventos } = await import('./lib/eventos');
    iniciarSuscriptor(COLAS.USUARIOS, drenarEventos, Number(process.env.EVENTS_POLL_MS ?? 5000));
  }
}
