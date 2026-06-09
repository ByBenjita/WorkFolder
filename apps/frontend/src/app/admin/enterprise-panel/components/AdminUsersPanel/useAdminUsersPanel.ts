import { useState, useEffect, useCallback } from 'react';
import { authApi, AdminUser } from '@/services/authApi';

export function useAdminUsersPanel() {
  const [users,         setUsers]         = useState<AdminUser[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [search,        setSearch]        = useState('');
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [successMsg,    setSuccessMsg]    = useState('');

  const selected    = users.find((u) => u.id === selectedId) ?? null;
  const activeCount = users.filter((u) => !u.banned).length;

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [usersRes, sessionRes] = await Promise.all([
        authApi.adminListUsers(),
        authApi.getSession(),
      ]);
      if (usersRes.success) {
        setUsers(usersRes.users);
        if (sessionRes.success) setCurrentUserId(sessionRes.user.id);
      } else {
        setError((usersRes as any).message || 'Error al cargar usuarios');
      }
    } catch {
      setError('Error de conexión al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSaved = useCallback(() => {
    fetchUsers();
    setSuccessMsg('Cambios guardados.');
    setTimeout(() => setSuccessMsg(''), 3000);
  }, [fetchUsers]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true); setDeleteError('');
    try {
      const res = await authApi.adminDeleteUser(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        if (selectedId === deleteTarget.id) setSelectedId(null);
        setSuccessMsg(`${deleteTarget.email} eliminado correctamente.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchUsers();
      } else {
        setDeleteError((res as any).message || 'Error al eliminar');
      }
    } catch {
      setDeleteError('Error de conexión');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, selectedId, fetchUsers]);

  return {
    users, loading, error,
    search, setSearch,
    selectedId, setSelectedId,
    showCreate, setShowCreate,
    deleteTarget, setDeleteTarget,
    deleteLoading, deleteError, setDeleteError,
    currentUserId, successMsg,
    selected, activeCount,
    fetchUsers, handleSaved, handleDeleteConfirm,
  };
}
