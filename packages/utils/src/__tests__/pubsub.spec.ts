import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { publicar, consumirLote, drenarSuscripcion, workerEventosAutorizado, MAX_ENTREGAS, TOPICS } from '../pubsub';

/** Cliente Supabase falso: rpc() para publicar_evento y schema('pgmq_public').rpc() para la cola */
function fakeClient() {
  const rpc      = vi.fn().mockResolvedValue({ data: 2, error: null });
  const queueRpc = vi.fn().mockResolvedValue({ data: [], error: null });
  return { rpc, queueRpc, client: { rpc, schema: vi.fn(() => ({ rpc: queueRpc })) } };
}

const msg = (msg_id: number, read_ct = 1, message: unknown = {
  evento_id: 'e1', topic: TOPICS.PAGO_APROBADO, payload: { admin_id: 'a1' }, publicado_en: '2026-10-21T00:00:00Z',
}) => ({ msg_id, read_ct, message });

/** msg_ids confirmados (archive) */
const confirmados = (queueRpc: ReturnType<typeof vi.fn>) =>
  queueRpc.mock.calls.filter(([fn]) => fn === 'archive').map(([, a]) => a.message_id);

let silencio: ReturnType<typeof vi.spyOn>[];
beforeEach(() => { silencio = [vi.spyOn(console, 'error').mockImplementation(() => {})]; });
afterEach(() => { silencio.forEach((s) => s.mockRestore()); delete process.env.EVENTS_WORKER_SECRET; });

describe('pubsub — publicar', () => {
  it('llama a publicar_evento con el tema y el payload', async () => {
    const { client, rpc } = fakeClient();
    await publicar(client, TOPICS.PAGO_APROBADO, { admin_id: 'a1' });
    expect(rpc).toHaveBeenCalledWith('publicar_evento', { p_topic: 'pago.aprobado', p_payload: { admin_id: 'a1' } });
  });

  it('lanza si la publicación falla (el productor no debe dar ack)', async () => {
    const { client, rpc } = fakeClient();
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'sin suscriptores' } });
    await expect(publicar(client, TOPICS.PAGO_APROBADO, {})).rejects.toThrow('sin suscriptores');
  });
});

describe('pubsub — consumirLote', () => {
  it('confirma (archive) los mensajes procesados', async () => {
    const { client, queueRpc } = fakeClient();
    queueRpc.mockResolvedValueOnce({ data: [msg(1), msg(2)], error: null });
    const manejador = vi.fn().mockResolvedValue(undefined);

    const r = await consumirLote(client, 'cola_x', manejador);

    expect(queueRpc).toHaveBeenCalledWith('read', { queue_name: 'cola_x', sleep_seconds: 30, n: 10 });
    expect(manejador).toHaveBeenCalledTimes(2);
    expect(confirmados(queueRpc)).toEqual([1, 2]);
    expect(r).toEqual({ leidos: 2, procesados: 2, descartados: 0, fallidos: 0 });
  });

  it('no confirma si el manejador falla (se reintenta al vencer el timeout)', async () => {
    const { client, queueRpc } = fakeClient();
    queueRpc.mockResolvedValueOnce({ data: [msg(1), msg(2)], error: null });
    const manejador = vi.fn().mockRejectedValueOnce(new Error('db caída')).mockResolvedValueOnce(undefined);

    const r = await consumirLote(client, 'cola_x', manejador);

    expect(confirmados(queueRpc)).toEqual([2]);
    expect(r).toMatchObject({ procesados: 1, fallidos: 1 });
  });

  it(`archiva como dead-letter tras ${MAX_ENTREGAS} entregas sin procesar`, async () => {
    const { client, queueRpc } = fakeClient();
    queueRpc.mockResolvedValueOnce({ data: [msg(7, MAX_ENTREGAS + 1)], error: null });
    const manejador = vi.fn();

    const r = await consumirLote(client, 'cola_x', manejador);

    expect(manejador).not.toHaveBeenCalled();
    expect(confirmados(queueRpc)).toEqual([7]);
    expect(r.descartados).toBe(1);
  });

  it('descarta mensajes sin el sobre esperado', async () => {
    const { client, queueRpc } = fakeClient();
    queueRpc.mockResolvedValueOnce({ data: [msg(3, 1, { foo: 'bar' })], error: null });
    const manejador = vi.fn();

    const r = await consumirLote(client, 'cola_x', manejador);

    expect(manejador).not.toHaveBeenCalled();
    expect(confirmados(queueRpc)).toEqual([3]);
    expect(r.descartados).toBe(1);
  });

  it('no lanza si la lectura de la cola falla', async () => {
    const { client, queueRpc } = fakeClient();
    queueRpc.mockResolvedValueOnce({ data: null, error: { message: 'down' } });
    await expect(consumirLote(client, 'cola_x', vi.fn())).resolves.toMatchObject({ leidos: 0 });
  });
});

describe('pubsub — drenarSuscripcion', () => {
  it('lee lotes hasta que la cola queda vacía', async () => {
    const { client, queueRpc } = fakeClient();
    queueRpc
      .mockResolvedValueOnce({ data: [msg(1), msg(2)], error: null })
      .mockResolvedValueOnce({ data: null, error: null }) // archive 1
      .mockResolvedValueOnce({ data: null, error: null }) // archive 2
      .mockResolvedValueOnce({ data: [msg(3)], error: null });

    const r = await drenarSuscripcion(client, 'cola_x', vi.fn().mockResolvedValue(undefined), { batch: 2 });
    expect(r).toMatchObject({ leidos: 3, procesados: 3 });
  });
});

describe('pubsub — workerEventosAutorizado', () => {
  const req = (h: Record<string, string>) => ({ headers: new Headers(h) });

  it('acepta el secreto correcto', () => {
    process.env.EVENTS_WORKER_SECRET = 's3creto';
    expect(workerEventosAutorizado(req({ 'x-worker-secret': 's3creto' }))).toBe(true);
  });

  it('rechaza secreto incorrecto o sin configurar', () => {
    expect(workerEventosAutorizado(req({ 'x-worker-secret': 's3creto' }))).toBe(false);
    process.env.EVENTS_WORKER_SECRET = 's3creto';
    expect(workerEventosAutorizado(req({ 'x-worker-secret': 'otro' }))).toBe(false);
  });
});
