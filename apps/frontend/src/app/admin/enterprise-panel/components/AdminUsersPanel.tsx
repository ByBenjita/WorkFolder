'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { authApi, AdminUser } from '@/services/authApi';
import { panelStyles } from './EnterprisePanel/EnterprisePanel.styles';

// ── Modal de confirmacion para promover admin ─────────────────────
interface PromoteModalProps {
  isOpen:    boolean;
  userEmail: string;
  onConfirm: () => void;
  onCancel:  () => void;
  loading:   boolean;
  error:     string;
}

function PromoteModal({ isOpen, userEmail, onConfirm, onCancel, loading, error }: PromoteModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: 16, padding: 32,
        width: '100%', maxWidth: 400,
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        <h3 style={{ color: '#111827', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Promover a Administrador
        </h3>
        <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Vas a otorgar permisos de administrador a:
        </p>
        <div style={{
          backgroundColor: '#f3f4f6', borderRadius: 8, padding: '10px 14px',
          marginBottom: 16, fontWeight: 600, fontSize: 14, color: '#111827',
        }}>
          {userEmail}
        </div>
        <div style={{
          backgroundColor: '#fef3c7', border: '1px solid #fde68a',
          borderRadius: 8, padding: '10px 14px', marginBottom: 20,
          fontSize: 12, color: '#92400e', lineHeight: 1.5,
        }}>
          Esta accion otorga acceso completo de administrador al sistema. Asegurate de que sea el usuario correcto.
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: 8,
              border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
              color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              backgroundColor: loading ? '#d1d5db' : '#3b82f6',
              color: '#ffffff', fontWeight: 700, fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export default function AdminUsersPanel() {
  const [users,          setUsers]          = useState<AdminUser[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [promoteTarget,  setPromoteTarget]  = useState<AdminUser | null>(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteError,   setPromoteError]   = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.adminListUsers();
      if (result.success) {
        setUsers(result.users);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setError((result as any).message || 'Error al cargar usuarios');
      }
    } catch {
      setIsAdmin(false);
      setError('Error de conexion al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handlePromoteConfirm = async () => {
    if (!promoteTarget) return;
    setPromoteLoading(true);
    setPromoteError('');

    try {
      const result = await authApi.adminPromoteUser(promoteTarget.id);
      if (result.success) {
        setPromoteTarget(null);
        setSuccessMsg(`${promoteTarget.email} ahora es administrador`);
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchUsers();
      } else {
        setPromoteError((result as any).message || 'Error al promover usuario');
      }
    } catch {
      setPromoteError('Error de conexion al promover usuario');
    } finally {
      setPromoteLoading(false);
    }
  };

  return (
    <div>
      <PromoteModal
        isOpen={promoteTarget !== null}
        userEmail={promoteTarget?.email || ''}
        onConfirm={handlePromoteConfirm}
        onCancel={() => { setPromoteTarget(null); setPromoteError(''); }}
        loading={promoteLoading}
        error={promoteError}
      />

      <h2 className="section-title">Usuarios del Sistema</h2>

      {successMsg && (
        <div style={{
          backgroundColor: '#d1fae5', border: '1px solid #6ee7b7',
          color: '#065f46', padding: '12px 16px', borderRadius: 6,
          marginBottom: 16, fontSize: 14,
        }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fee2e2', border: '1px solid #fecaca',
          color: '#991b1b', padding: '12px 16px', borderRadius: 6,
          marginBottom: 16, fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Usuarios registrados</h3>
            <p className="text-muted mt-8">
              {loading ? 'Cargando...' : `Total: ${users.length} usuario${users.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            <p style={{ fontSize: 14 }}>Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <p style={{ fontSize: 14 }}>No hay usuarios en el sistema</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Registro</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="td-white">{u.email}</td>
                  <td>
                    <span className={`chip ${u.is_admin ? 'blue' : ''}`}>
                      {u.is_admin ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td className="td-muted">
                    {new Date(u.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  {isAdmin && (
                    <td>
                      {u.is_admin ? (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
                      ) : (
                        <button
                          className="btn-ghost"
                          onClick={() => { setPromoteError(''); setPromoteTarget(u); }}
                          style={{ fontSize: 12, color: '#3b82f6' }}
                        >
                          Hacer Administrador
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx global>{panelStyles}</style>
    </div>
  );
}
