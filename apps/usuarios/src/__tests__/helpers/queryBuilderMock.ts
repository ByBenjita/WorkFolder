import { vi } from 'vitest';

/**
 * Mock mínimo de un query builder estilo Supabase (`sb.from(...).select(...)...`).
 * Es "thenable": se puede usar con `await` directamente, como hace el código real
 * (`const { data, error } = await query;`).
 */
export function buildQueryBuilderMock(result: { data: unknown; error: unknown }) {
  const builder: any = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}
