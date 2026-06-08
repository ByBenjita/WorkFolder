import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getSpec, OPTIONS } from '../app/api/swagger/route';
import { GET as getDocs } from '../app/docs/route';

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

describe('GET /api/swagger (documentos)', () => {
  it('devuelve Content-Type application/json', async () => {
    const req = makeRequest('http://localhost:3002/api/swagger');
    const res = await getSpec(req);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('devuelve un spec OpenAPI 3.0 válido', async () => {
    const req = makeRequest('http://localhost:3002/api/swagger');
    const res = await getSpec(req);
    const body = await res.json();
    expect(body.openapi).toBe('3.0.0');
    expect(body.info.title).toContain('Documentos');
  });

  it('usa el host de la request como server URL', async () => {
    const req = makeRequest('http://localhost:3002/api/swagger');
    const res = await getSpec(req);
    const body = await res.json();
    expect(body.servers[0].url).toBe('http://localhost:3002');
  });

  it('usa x-forwarded-host en producción', async () => {
    const req = makeRequest('http://localhost:3002/api/swagger', {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'api-workfolder-documentos.vercel.app',
    });
    const res = await getSpec(req);
    const body = await res.json();
    expect(body.servers[0].url).toBe('https://api-workfolder-documentos.vercel.app');
  });

  it('OPTIONS devuelve 204', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
  });
});

describe('GET /docs (documentos)', () => {
  it('devuelve Content-Type text/html', async () => {
    const req = makeRequest('http://localhost:3002/docs');
    const res = await getDocs(req);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('el HTML incluye SwaggerUIBundle', async () => {
    const req = makeRequest('http://localhost:3002/docs');
    const res = await getDocs(req);
    const html = await res.text();
    expect(html).toContain('SwaggerUIBundle');
  });

  it('el HTML apunta al spec del mismo origen', async () => {
    const req = makeRequest('http://localhost:3002/docs');
    const res = await getDocs(req);
    const html = await res.text();
    expect(html).toContain('http://localhost:3002/api/swagger');
  });
});
