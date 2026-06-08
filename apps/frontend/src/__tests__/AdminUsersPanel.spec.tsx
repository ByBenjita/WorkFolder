import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/app/admin/enterprise-panel/components/AdminUsersPanel/useAdminUsersPanel', () => ({
  useAdminUsersPanel: vi.fn(),
}));

vi.mock('@/app/admin/enterprise-panel/components/AdminUsersPanel/AdminUsersPanel.styles', () => ({
  adminUsersPanelStyles: '',
}));

vi.mock('@/app/admin/enterprise-panel/components/EnterprisePanel/EnterprisePanel.styles', () => ({
  panelStyles: '',
}));

vi.mock('@/services/authApi', () => ({
  authApi: {
    adminInviteUser:    vi.fn(),
    adminUpdateUser:    vi.fn(),
    adminResetPassword: vi.fn(),
  },
}));

import { useAdminUsersPanel } from '@/app/admin/enterprise-panel/components/AdminUsersPanel/useAdminUsersPanel';
import AdminUsersPanel from '@/app/admin/enterprise-panel/components/AdminUsersPanel/AdminUsersPanel';

const mockUsers = [
  {
    id: 'user-1', email: 'admin@empresa.cl', full_name: 'Admin Principal',
    role: 'admin', is_admin: true, level: 'admin_principal' as const,
    permissions: { create_users: true, view_audit: true, manage_billing: true },
    banned: false, mfa_enabled: true, created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2', email: 'usuario@empresa.cl', full_name: 'Usuario Estándar',
    role: 'authenticated', is_admin: false, level: 'estandar' as const,
    permissions: { create_users: false, view_audit: false, manage_billing: false },
    banned: false, mfa_enabled: false, created_at: '2024-01-02T00:00:00Z',
  },
];

const baseHookValue = {
  users: mockUsers, loading: false, error: null,
  search: '', setSearch: vi.fn(),
  selectedId: null, setSelectedId: vi.fn(),
  showCreate: false, setShowCreate: vi.fn(),
  deleteTarget: null, setDeleteTarget: vi.fn(),
  deleteLoading: false, deleteError: '', setDeleteError: vi.fn(),
  currentUserId: 'user-1', successMsg: '',
  selected: null, activeCount: 2,
  fetchUsers: vi.fn(), handleSaved: vi.fn(), handleDeleteConfirm: vi.fn(),
};

beforeEach(() => {
  vi.mocked(useAdminUsersPanel).mockReturnValue(baseHookValue);
});

describe('AdminUsersPanel', () => {
  it('muestra el spinner de carga cuando loading es true', () => {
    vi.mocked(useAdminUsersPanel).mockReturnValue({ ...baseHookValue, loading: true });
    render(<AdminUsersPanel />);
    expect(screen.getByText(/cargando usuarios/i)).toBeInTheDocument();
  });

  it('muestra el mensaje de error cuando hay error', () => {
    vi.mocked(useAdminUsersPanel).mockReturnValue({ ...baseHookValue, error: 'Sin permisos' });
    render(<AdminUsersPanel />);
    expect(screen.getByText(/sin permisos/i)).toBeInTheDocument();
  });

  it('renderiza la lista de usuarios', () => {
    render(<AdminUsersPanel />);
    expect(screen.getByText('admin@empresa.cl')).toBeInTheDocument();
    expect(screen.getByText('usuario@empresa.cl')).toBeInTheDocument();
  });

  it('muestra el contador de usuarios activos', () => {
    render(<AdminUsersPanel />);
    expect(screen.getByText(/2 activos/i)).toBeInTheDocument();
  });

  it('muestra el mensaje de éxito cuando successMsg tiene contenido', () => {
    vi.mocked(useAdminUsersPanel).mockReturnValue({ ...baseHookValue, successMsg: 'Cambios guardados.' });
    render(<AdminUsersPanel />);
    expect(screen.getByText('Cambios guardados.')).toBeInTheDocument();
  });

  it('llama a setSearch cuando se escribe en el input de búsqueda', () => {
    const setSearch = vi.fn();
    vi.mocked(useAdminUsersPanel).mockReturnValue({ ...baseHookValue, setSearch });
    render(<AdminUsersPanel />);
    const input = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(input, { target: { value: 'admin' } });
    expect(setSearch).toHaveBeenCalledWith('admin');
  });

  it('llama a setShowCreate al hacer clic en el botón de nuevo usuario', () => {
    const setShowCreate = vi.fn();
    vi.mocked(useAdminUsersPanel).mockReturnValue({ ...baseHookValue, setShowCreate });
    render(<AdminUsersPanel />);
    const btn = screen.getByRole('button', { name: /nuevo usuario/i });
    fireEvent.click(btn);
    expect(setShowCreate).toHaveBeenCalledWith(true);
  });

  it('muestra el modal de confirmación cuando deleteTarget está definido', () => {
    vi.mocked(useAdminUsersPanel).mockReturnValue({ ...baseHookValue, deleteTarget: mockUsers[1] });
    render(<AdminUsersPanel />);
    expect(screen.getByText(/Esta acción eliminará permanentemente/i)).toBeInTheDocument();
    expect(screen.getByText(/Esta acción es irreversible/i)).toBeInTheDocument();
  });

  it('llama a handleDeleteConfirm al confirmar la eliminación', () => {
    const handleDeleteConfirm = vi.fn();
    vi.mocked(useAdminUsersPanel).mockReturnValue({
      ...baseHookValue, deleteTarget: mockUsers[1], handleDeleteConfirm,
    });
    render(<AdminUsersPanel />);
    const btn = screen.getByRole('button', { name: /^Eliminar$/i });
    fireEvent.click(btn);
    expect(handleDeleteConfirm).toHaveBeenCalledOnce();
  });

  it('llama a setDeleteTarget(null) al cancelar la eliminación', () => {
    const setDeleteTarget = vi.fn();
    vi.mocked(useAdminUsersPanel).mockReturnValue({
      ...baseHookValue, deleteTarget: mockUsers[1], setDeleteTarget,
    });
    render(<AdminUsersPanel />);
    const btn = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(btn);
    expect(setDeleteTarget).toHaveBeenCalledWith(null);
  });

  it('no renderiza el modal de eliminación cuando deleteTarget es null', () => {
    render(<AdminUsersPanel />);
    expect(screen.queryByText(/eliminar usuario/i)).not.toBeInTheDocument();
  });
});
