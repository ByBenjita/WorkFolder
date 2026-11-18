import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TOPICOS_NEGOCIO, categorizarAccion, emitirEventoNegocio, ingestaAutorizada } from '../eventos';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 202 });
  vi.stubGlobal('fetch', fetchMock);
  globalThis.__eventosPausadoHasta = 0;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('eventos — categorizarAccion', () => {
  it.each([
    ['Seguridad', 'Inicio de sesión fallido', 'login_fallido'],
    ['Seguridad', 'Intento de descarga de documento ajeno', 'seguridad'],
    ['Acceso', 'Inició sesión', 'login_ok'],
    ['Acceso', 'Cerró sesión', 'logout'],
    ['Subida', 'Subió planilla.pdf', 'subida'],
    ['Acceso', 'Descargó plan_2026.pdf', 'descarga'],
    ['Eliminación', 'Eliminó contrato.pdf', 'eliminacion'],
    ['Eliminación', 'Eliminó el usuario a@b.cl', 'admin'],
    ['Modificación', 'Firmó el documento RRHH x.pdf', 'firma'],
    ['Modificación', 'Cambió la clave de x.pdf', 'cambio_clave'],
    ['Modificación', 'Restableció la contraseña de a@b.cl', 'admin'],
    ['Modificación', 'Inició el pago del plan Pro', 'pago_iniciado'],
    ['Modificación', 'Suscripción al plan business activada por Mercado Pago', 'facturacion'],
    ['Acceso', 'Verificó su código 2FA', 'otro'],
  ])('%s / %s → %s', (evento, accion, esperado) => {
    expect(categorizarAccion(evento, accion)).toBe(esperado);
  });
});

describe('eventos — emitirEventoNegocio', () => {
  it('no hace nada sin REPORTES_API_URL o sin secreto', async () => {
    vi.stubEnv('REPORTES_API_URL', '');
    vi.stubEnv('REPORTES_INGEST_SECRET', 's');
    await emitirEventoNegocio(TOPICOS_NEGOCIO.ACTIVIDAD, 'u1', { tipo: 'Acceso', datos: {} });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envía el evento a reportes con el secreto, origen e id único', async () => {
    vi.stubEnv('REPORTES_API_URL', 'https://reportes.example/');
    vi.stubEnv('REPORTES_INGEST_SECRET', 'secreto');
    vi.stubEnv('SERVICIO_NOMBRE', 'documentos');

    await emitirEventoNegocio(TOPICOS_NEGOCIO.ACTIVIDAD, 'u1', { tipo: 'Subida', datos: { categoria: 'subida' } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://reportes.example/api/eventos');
    expect(init.headers['x-ingest-secret']).toBe('secreto');
    expect(JSON.parse(init.body)).toMatchObject({
      evento_id: expect.any(String), topico: 'workfolder-actividad', tipo: 'Subida',
      origen: 'documentos', clave: 'u1', datos: { categoria: 'subida' }, ocurrido_en: expect.any(String),
    });
  });

  it('no lanza si reportes no responde y pausa los envíos', async () => {
    vi.stubEnv('REPORTES_API_URL', 'https://reportes.example');
    vi.stubEnv('REPORTES_INGEST_SECRET', 'secreto');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(emitirEventoNegocio(TOPICOS_NEGOCIO.PAGOS, 'p1', { tipo: 'pago.aprobado', datos: {} })).resolves.toBeUndefined();
    await emitirEventoNegocio(TOPICOS_NEGOCIO.PAGOS, 'p2', { tipo: 'pago.aprobado', datos: {} });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('no lanza si reportes responde error', async () => {
    vi.stubEnv('REPORTES_API_URL', 'https://reportes.example');
    vi.stubEnv('REPORTES_INGEST_SECRET', 'secreto');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(emitirEventoNegocio(TOPICOS_NEGOCIO.ACTIVIDAD, null, { tipo: 'Acceso', datos: {} })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('eventos — ingestaAutorizada', () => {
  const req = (h: Record<string, string>) => ({ headers: new Headers(h) });
  it('exige el secreto exacto', () => {
    vi.stubEnv('REPORTES_INGEST_SECRET', 'secreto');
    expect(ingestaAutorizada(req({ 'x-ingest-secret': 'secreto' }))).toBe(true);
    expect(ingestaAutorizada(req({ 'x-ingest-secret': 'otro' }))).toBe(false);
    expect(ingestaAutorizada(req({}))).toBe(false);
  });
});
