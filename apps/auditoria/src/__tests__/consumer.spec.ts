import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const rpc    = vi.fn();
  const upsert = vi.fn();
  return {
    rpc,
    upsert,
    client: {
      schema: vi.fn(() => ({ rpc })),
      from:   vi.fn(() => ({ upsert })),
      auth:   { admin: { getUserById: vi.fn() } },
    },
  };
});

vi.mock('@/services/supabase', () => ({ supabaseAdmin: mocks.client }));

import { procesarLote, drenarCola, mensajeAFila, limpiarCacheEmails, MAX_REINTENTOS } from '@/lib/consumer';

/** Construye un mensaje de cola con el payload dado */
function msg(id: number, message: Record<string, any>, read_ct = 1) {
  return { msg_id: id, read_ct, enqueued_at: '2026-09-26T13:00:00Z', vt: '2026-09-26T13:00:30Z', message };
}

// UUIDs de prueba (las columnas user_id y documento_id son uuid)
const U1 = '11111111-1111-4111-8111-111111111111';
const D1 = '22222222-2222-4222-8222-222222222222';

/** Payload válido de evento; `extra` sobrescribe campos */
const valido = (extra: Record<string, any> = {}) => ({
  evento: 'Subida', accion: 'Subió a.pdf', user_id: U1, documento_id: D1, ip: '200.1.1.1',
  ocurrido_en: '2026-09-26T12:59:59Z', ...extra,
});

/** Configura rpc: `read` devuelve los mensajes dados, `archive` responde ok */
function colaCon(mensajes: unknown[]) {
  mocks.rpc.mockImplementation(async (fn: string) =>
    fn === 'read' ? { data: mensajes, error: null } : { data: true, error: null }
  );
}

/** ids de los mensajes archivados durante el test */
const archivados = () =>
  mocks.rpc.mock.calls.filter(([fn]) => fn === 'archive').map(([, args]) => args.message_id);

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.rpc.mockReset();
  mocks.upsert.mockReset().mockResolvedValue({ error: null });
  mocks.client.auth.admin.getUserById.mockReset().mockResolvedValue({ data: { user: { email: 'maria@empresa.cl' } } });
  limpiarCacheEmails();
});

describe('mensajeAFila', () => {
  it('transforma un mensaje válido', () => {
    expect(mensajeAFila(msg(1, valido()))).toMatchObject({
      msg_id: 1, evento: 'Subida', user_id: U1, documento_id: D1, ocurrido_en: '2026-09-26T12:59:59Z', metadata: {},
    });
  });

  it('guarda null en ids que no son UUID y conserva el valor recibido en metadata', () => {
    const fila = mensajeAFila(msg(1, valido({ evento: 'Seguridad', user_id: 'u1', documento_id: "abc' OR 1=1", metadata: { x: 1 } })));
    expect(fila).toMatchObject({
      user_id: null,
      documento_id: null,
      metadata: { x: 1, user_id_recibido: 'u1', documento_id_recibido: "abc' OR 1=1" },
    });
  });

  it('usa enqueued_at si falta ocurrido_en', () => {
    expect(mensajeAFila(msg(1, valido({ ocurrido_en: undefined })))?.ocurrido_en).toBe('2026-09-26T13:00:00Z');
  });

  it('rechaza eventos desconocidos o sin acción', () => {
    expect(mensajeAFila(msg(1, valido({ evento: 'Hackeo' })))).toBeNull();
    expect(mensajeAFila(msg(1, valido({ accion: '  ' })))).toBeNull();
  });
});

describe('procesarLote', () => {
  it('lee de pgmq_public, registra en audit_log con email y archiva', async () => {
    colaCon([msg(10, valido()), msg(11, valido({ evento: 'Acceso' }))]);

    const r = await procesarLote({ batch: 5 });

    expect(mocks.client.schema).toHaveBeenCalledWith('pgmq_public');
    expect(mocks.rpc).toHaveBeenCalledWith('read', { queue_name: 'audit_events', sleep_seconds: 30, n: 5 });
    expect(mocks.client.from).toHaveBeenCalledWith('audit_log');
    const [filas, opts] = mocks.upsert.mock.calls[0];
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({ msg_id: 10, user_email: 'maria@empresa.cl' });
    expect(opts).toEqual({ onConflict: 'msg_id', ignoreDuplicates: true });
    expect(archivados()).toEqual([10, 11]);
    expect(r).toEqual({ leidos: 2, registrados: 2, descartados: 0, fallidos: 0 });
  });

  it('consulta el email una sola vez por usuario (cache)', async () => {
    colaCon([msg(1, valido()), msg(2, valido()), msg(3, valido())]);
    await procesarLote();
    expect(mocks.client.auth.admin.getUserById).toHaveBeenCalledTimes(1);
  });

  it('cola vacía: no inserta nada', async () => {
    colaCon([]);
    const r = await procesarLote();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(r.leidos).toBe(0);
  });

  it('si falla la lectura no lanza', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'schema no expuesto' } });
    await expect(procesarLote()).resolves.toEqual({ leidos: 0, registrados: 0, descartados: 0, fallidos: 0 });
  });

  it('archiva sin registrar los mensajes inválidos', async () => {
    colaCon([msg(1, { evento: 'X' }), msg(2, valido())]);
    const r = await procesarLote();
    expect(mocks.upsert.mock.calls[0][0]).toHaveLength(1);
    expect(archivados()).toEqual([1, 2]);
    expect(r).toMatchObject({ registrados: 1, descartados: 1 });
  });

  it('si el lote falla, reintenta uno por uno y deja en la cola el que falla', async () => {
    colaCon([msg(1, valido()), msg(2, valido())]);
    mocks.upsert
      .mockResolvedValueOnce({ error: { message: 'lote falló' } })   // lote
      .mockResolvedValueOnce({ error: null })                        // msg 1 ok
      .mockResolvedValueOnce({ error: { message: 'fila rota' } });   // msg 2 falla

    const r = await procesarLote();

    expect(archivados()).toEqual([1]);   // el 2 no se archiva → reintento
    expect(r).toMatchObject({ registrados: 1, fallidos: 1 });
  });

  it(`archiva como dead-letter tras ${MAX_REINTENTOS} intentos`, async () => {
    colaCon([msg(7, valido(), MAX_REINTENTOS)]);
    mocks.upsert.mockResolvedValue({ error: { message: 'fila rota' } });

    const r = await procesarLote();

    expect(archivados()).toEqual([7]);
    expect(r).toMatchObject({ registrados: 0, descartados: 1, fallidos: 0 });
  });
});

describe('drenarCola', () => {
  it('procesa lotes hasta que la cola queda vacía', async () => {
    let llamada = 0;
    mocks.rpc.mockImplementation(async (fn: string) => {
      if (fn !== 'read') return { data: true, error: null };
      llamada++;
      return { data: llamada === 1 ? [msg(1, valido()), msg(2, valido())] : [msg(3, valido())], error: null };
    });

    const r = await drenarCola({ batch: 2 });

    expect(llamada).toBe(2);
    expect(r).toMatchObject({ leidos: 3, registrados: 3 });
  });
});