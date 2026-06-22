import { vi } from 'vitest';

/**
 * Query builder encadenable estilo Supabase, "thenable" para poder usar
 * `await query` directamente, igual que el código real.
 */
export function queryResult(result: { data: unknown; error: unknown }) {
  const builder: any = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

export function buildDocumentosSupabaseMock() {
  return {
    auth: {
      getUser: vi.fn(),
      admin: { getUserById: vi.fn() },
      mfa: { challengeAndVerify: vi.fn() },
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        download: vi.fn(),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  };
}
