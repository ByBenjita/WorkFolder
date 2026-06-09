import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminUsersPanel } from '@/app/admin/enterprise-panel/components/AdminUsersPanel/useAdminUsersPanel';
import { authApi } from '@/services/authApi';

vi.mock('@/services/authApi', () => ({
  authApi: {
    adminListUsers:  vi.fn(),
    getSession:      vi.fn(),
    adminDeleteUser: vi.fn(),
  },
}));

const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@empresa.cl',
    full_name: 'Admin Principal',
    is_admin: true,
    level: 'admin_principal' as const,
    permissions: { create_users: true, view_audit: true, manage_billing: true },
    banned: false,
    mfa_enabled: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'usuario@empresa.cl',
    full_name: 'Usuario Estándar',
    is_admin: false,
    level: 'estandar' as const,
    permissions: { create_users: false, view_audit: false, manage_billing: false },
    banned: false,
    mfa_enabled: false,
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'bloqueado@empresa.cl',
    full_name: 'Usuario Bloqueado',
    is_admin: false,
    level: 'estandar' as const,
    permissions: { create_users: false, view_audit: false, manage_billing: false },
    banned: true,
    mfa_enabled: false,
    created_at: '2024-01-03T00:00:00Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authApi.adminListUsers).mockResolvedValue({ success: true, users: mockUsers } as any);
  vi.mocked(authApi.getSession).mockResolvedValue({ success: true, user: { id: 'user-1' } } as any);
});

describe('useAdminUsersPanel', () => {
  it('inicia con loading en true', () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    expect(result.current.loading).toBe(true);
  });

  it('carga los usuarios al montar el componente', async () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toHaveLength(3);
    expect(authApi.adminListUsers).toHaveBeenCalledOnce();
  });

  it('establece currentUserId desde la sesión activa', async () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentUserId).toBe('user-1');
  });

  it('calcula activeCount excluyendo usuarios baneados', async () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeCount).toBe(2);
  });

  it('establece error cuando falla la carga', async () => {
    vi.mocked(authApi.adminListUsers).mockResolvedValue({ success: false, message: 'Sin permisos' } as any);
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Sin permisos');
    expect(result.current.users).toHaveLength(0);
  });

  it('establece error de conexión cuando hay excepción', async () => {
    vi.mocked(authApi.adminListUsers).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Error de conexión al cargar usuarios');
  });

  it('actualiza el estado de búsqueda', async () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.setSearch('admin'); });
    expect(result.current.search).toBe('admin');
  });

  it('selected retorna el usuario cuyo id coincide con selectedId', async () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.setSelectedId('user-2'); });
    expect(result.current.selected?.email).toBe('usuario@empresa.cl');
  });

  it('selected retorna null cuando no hay selectedId', async () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.selected).toBeNull();
  });

  it('handleSaved recarga la lista y muestra mensaje de éxito', async () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(authApi.adminListUsers).mockClear();

    await act(async () => { result.current.handleSaved(); });

    expect(authApi.adminListUsers).toHaveBeenCalledOnce();
    expect(result.current.successMsg).toBe('Cambios guardados.');
  });

  it('handleDeleteConfirm no hace nada si no hay deleteTarget', async () => {
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleDeleteConfirm(); });
    expect(authApi.adminDeleteUser).not.toHaveBeenCalled();
  });

  it('handleDeleteConfirm elimina el usuario y refresca la lista', async () => {
    vi.mocked(authApi.adminDeleteUser).mockResolvedValue({ success: true } as any);
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.setDeleteTarget(mockUsers[1]); });
    await act(async () => { await result.current.handleDeleteConfirm(); });

    expect(authApi.adminDeleteUser).toHaveBeenCalledWith('user-2');
    expect(result.current.deleteTarget).toBeNull();
    expect(result.current.successMsg).toContain('usuario@empresa.cl');
  });

  it('handleDeleteConfirm limpia selectedId si se elimina el usuario seleccionado', async () => {
    vi.mocked(authApi.adminDeleteUser).mockResolvedValue({ success: true } as any);
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSelectedId('user-2');
      result.current.setDeleteTarget(mockUsers[1]);
    });
    await act(async () => { await result.current.handleDeleteConfirm(); });

    expect(result.current.selectedId).toBeNull();
  });

  it('handleDeleteConfirm establece deleteError cuando falla', async () => {
    vi.mocked(authApi.adminDeleteUser).mockResolvedValue({ success: false, message: 'No autorizado' } as any);
    const { result } = renderHook(() => useAdminUsersPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.setDeleteTarget(mockUsers[1]); });
    await act(async () => { await result.current.handleDeleteConfirm(); });

    expect(result.current.deleteError).toBe('No autorizado');
    expect(result.current.deleteTarget).not.toBeNull();
  });
});
