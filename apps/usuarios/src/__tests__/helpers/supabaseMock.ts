import { vi } from 'vitest';

/**
 * Construye un cliente Supabase "falso" con todos los métodos usados por
 * las rutas de usuarios/admin/mfa. Cada test reconfigura el método que
 * necesite con `.mockResolvedValueOnce(...)` o `.mockResolvedValue(...)`.
 */
export function buildSupabaseClientMock() {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'mock no configurado' },
      }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      mfa: {
        listFactors: vi.fn().mockResolvedValue({ data: { all: [] }, error: null }),
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: 'aal1', nextLevel: 'aal2' },
        }),
        challengeAndVerify: vi.fn().mockResolvedValue({ data: {}, error: null }),
        enroll: vi.fn().mockResolvedValue({
          data: { id: 'factor-123', totp: { qr_code: 'data:image/png;base64,FAKE' } },
          error: null,
        }),
        unenroll: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      },
    },
  };
}

export type SupabaseClientMock = ReturnType<typeof buildSupabaseClientMock>;

