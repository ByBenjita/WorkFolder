'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { authApi, AdminUser, UserLevel, UserPermissions } from '@/services/authApi';
import { panelStyles } from './EnterprisePanel/EnterprisePanel.styles';

// ── Constantes ────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<UserLevel, string> = {
  admin_principal: 'Administrador Principal',
  admin_delegado:  'Admin Delegado',
  estandar:        'Estándar',
};

const LEVEL_OPTIONS: { value: UserLevel; label: string }[] = [
  { value: 'admin_principal', label: 'Administrador Principal' },
  { value: 'admin_delegado',  label: 'Admin Delegado' },
  { value: 'estandar',        label: 'Estándar' },
];

const PERM_ITEMS: { key: keyof UserPermissions; label: string }[] = [
  { key: 'create_users',   label: 'Crear usuarios' },
  { key: 'view_audit',     label: 'Ver Auditoría Live' },
  { key: 'manage_billing', label: 'Gestionar Facturación' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  borderRadius: 10, border: '1px solid var(--wf-line)',
  backgroundColor: 'var(--wf-surface)', color: 'var(--wf-ink)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'var(--wf-muted)', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: 6,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(email: string, fullName?: string | null) {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  const name  = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDisplayName(email: string, fullName?: string | null) {
  if (fullName?.trim()) return fullName.trim();
  return email.split('@')[0].split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getUserStatus(u: AdminUser): 'Activo' | 'Deshabilitado' | 'Pendiente MFA' {
  if (u.banned)        return 'Deshabilitado';
  if (!u.mfa_enabled)  return 'Pendiente MFA';
  return 'Activo';
}

function formatRutina(index: number) {
  return `000-${String(index + 1).padStart(2, '0')}`;
}

// ── Modal: Crear usuario ──────────────────────────────────────────────────────

interface CreateModalProps {
  onClose:   () => void;
  onCreated: () => void;
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [level,    setLevel]    = useState<UserLevel>('estandar');
  const [perms,    setPerms]    = useState<UserPermissions>({ create_users: false, view_audit: false, manage_billing: false });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const togglePerm = (key: keyof UserPermissions) =>
    setPerms((p) => ({ ...p, [key]: !p[key] }));

  const handleSubmit = async () => {
    if (!email.trim())       { setError('El email es requerido'); return; }
    if (!password.trim())    { setError('La contraseña es requerida'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true); setError('');
    try {
      const res = await authApi.adminInviteUser(email.trim(), password, level, perms, fullName.trim() || undefined);
      if (res.success) { onCreated(); onClose(); }
      else setError((res as any).message || 'Error al crear usuario');
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: 'var(--wf-surface)', borderRadius: 20,
        padding: 32, width: '100%', maxWidth: 440,
        boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        border: '1px solid var(--wf-line)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ color: 'var(--wf-ink)', fontSize: 17, fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
            Crear Nuevo Usuario
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wf-muted)', fontSize: 20 }}>×</button>
        </div>

        <label style={labelStyle}>Nombre Completo</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
          placeholder="Ej: Juan Pérez" style={inputStyle} autoComplete="off" />

        <label style={{ ...labelStyle, marginTop: 16 }}>Email Corporativo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@empresa.cl" style={inputStyle} autoComplete="off" />

        <label style={{ ...labelStyle, marginTop: 16 }}>Contraseña Inicial</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            style={{ ...inputStyle, paddingRight: 44 }}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowPass((v) => !v)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--wf-muted)', fontSize: 14, padding: 4,
          }}>
            {showPass ? '🙈' : '👁'}
          </button>
        </div>

        <label style={{ ...labelStyle, marginTop: 16 }}>Nivel de Autoridad</label>
        <select value={level} onChange={(e) => setLevel(e.target.value as UserLevel)} style={inputStyle}>
          {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <label style={{ ...labelStyle, marginTop: 16 }}>Permisos de Gestión</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {PERM_ITEMS.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => togglePerm(key)} style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                backgroundColor: perms[key] ? 'var(--wf-primary)' : 'transparent',
                border: `2px solid ${perms[key] ? 'var(--wf-primary)' : 'var(--wf-line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}>
                {perms[key] && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ color: 'var(--wf-ink-2)', fontSize: 13 }}>{label}</span>
            </label>
          ))}
        </div>

        {error && <p style={{ color: 'var(--wf-danger)', fontSize: 12, marginTop: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-ghost" onClick={onClose} disabled={loading} style={{ flex: 1 }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: '11px', borderRadius: 11, border: 'none',
            backgroundColor: loading ? '#d1d5db' : 'var(--wf-primary)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Confirmar eliminación ──────────────────────────────────────────────

interface DeleteModalProps {
  user:      AdminUser;
  onConfirm: () => void;
  onCancel:  () => void;
  loading:   boolean;
  error:     string;
}

function DeleteModal({ user, onConfirm, onCancel, loading, error }: DeleteModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: 'var(--wf-surface)', borderRadius: 20,
        padding: 32, width: '100%', maxWidth: 400,
        boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        border: '1px solid var(--wf-line)',
      }}>
        <h3 style={{ color: 'var(--wf-ink)', fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Eliminar Acceso</h3>
        <p style={{ color: 'var(--wf-muted)', fontSize: 13, marginBottom: 16 }}>
          Esta acción eliminará permanentemente la cuenta de:
        </p>
        <div style={{
          backgroundColor: 'var(--wf-surface-2)', borderRadius: 10,
          padding: '10px 14px', marginBottom: 16,
          fontWeight: 600, fontSize: 14, color: 'var(--wf-ink)',
          border: '1px solid var(--wf-line)',
        }}>
          {user.email}
        </div>
        <div style={{
          backgroundColor: 'var(--wf-danger-soft)',
          border: '1px solid oklch(0.58 0.20 22 / 0.25)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 20,
          fontSize: 12, color: 'var(--wf-danger)', lineHeight: 1.5,
        }}>
          Esta acción es irreversible. El usuario perderá acceso inmediatamente.
        </div>
        {error && <p style={{ color: 'var(--wf-danger)', fontSize: 12, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={onCancel} disabled={loading} style={{ flex: 1 }}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: '11px', borderRadius: 11, border: 'none',
            backgroundColor: loading ? '#d1d5db' : 'var(--wf-danger)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel de edición ──────────────────────────────────────────────────────────

interface EditPanelProps {
  user:       AdminUser;
  onSaved:    () => void;
  onDelete:   (u: AdminUser) => void;
  isSelf:     boolean;
  hideHeader?: boolean;
}

function EditPanel({ user, onSaved, onDelete, isSelf, hideHeader }: EditPanelProps) {
  const [fullName,     setFullName]     = useState(user.full_name ?? '');
  const [level,        setLevel]        = useState<UserLevel>(user.level ?? 'estandar');
  const [perms,        setPerms]        = useState<UserPermissions>(user.permissions);
  const [banned,       setBanned]       = useState(user.banned);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [newPass,      setNewPass]      = useState('');
  const [showNewPass,  setShowNewPass]  = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    setFullName(user.full_name ?? '');
    setLevel(user.level ?? 'estandar');
    setPerms(user.permissions);
    setBanned(user.banned);
    setError(''); setSuccess('');
    setNewPass(''); setResetError(''); setResetSuccess('');
  }, [user.id]);

  const togglePerm = (key: keyof UserPermissions) =>
    setPerms((p) => ({ ...p, [key]: !p[key] }));

  const handleResetPassword = async () => {
    if (!newPass.trim())    { setResetError('La contraseña no puede estar vacía'); return; }
    if (newPass.length < 8) { setResetError('Mínimo 8 caracteres'); return; }
    setResetLoading(true); setResetError(''); setResetSuccess('');
    try {
      const res = await authApi.adminResetPassword(user.id, newPass);
      if (res.success) {
        setResetSuccess('Contraseña restablecida correctamente.');
        setNewPass('');
        setTimeout(() => setResetSuccess(''), 4000);
      } else {
        setResetError((res as any).message || 'Error al restablecer');
      }
    } catch { setResetError('Error de conexión'); }
    finally { setResetLoading(false); }
  };

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await authApi.adminUpdateUser(user.id, level, perms, banned, fullName.trim() || undefined);
      if (res.success) {
        setSuccess('Cambios guardados correctamente.');
        setTimeout(() => setSuccess(''), 3000);
        onSaved();
      } else {
        setError((res as any).message || 'Error al guardar');
      }
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      backgroundColor: 'var(--wf-surface)',
      border: '1px solid var(--wf-line)',
      borderRadius: 16, padding: '24px 22px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {!hideHeader && (
        <div>
          <h3 style={{ color: 'var(--wf-ink)', fontSize: 15, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Modificar Usuario
          </h3>
          <p style={{ color: 'var(--wf-muted)', fontSize: 12, margin: 0 }}>{user.email}</p>
        </div>
      )}

      {isSelf && (
        <div style={{
          backgroundColor: 'oklch(0.97 0.01 220)',
          border: '1px solid oklch(0.80 0.05 220)',
          borderRadius: 10, padding: '10px 12px',
          fontSize: 12, color: 'oklch(0.45 0.08 220)',
        }}>
          Estás editando tu propio perfil de administrador.
        </div>
      )}

      {/* Nombre */}
      <div>
        <label style={labelStyle}>Nombre Completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ej: Juan Pérez"
          style={inputStyle}
          autoComplete="off"
        />
      </div>

      {/* Nivel de Autoridad */}
      <div>
        <label style={labelStyle}>Nivel de Autoridad</label>
        <select value={level} onChange={(e) => setLevel(e.target.value as UserLevel)} style={{ ...inputStyle, cursor: 'pointer' }}>
          {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Permisos */}
      <div>
        <label style={labelStyle}>Permisos de Gestión</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          {PERM_ITEMS.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => togglePerm(key)} style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                backgroundColor: perms[key] ? 'var(--wf-primary)' : 'transparent',
                border: `2px solid ${perms[key] ? 'var(--wf-primary)' : 'var(--wf-line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}>
                {perms[key] && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ color: 'var(--wf-ink-2)', fontSize: 13 }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Estado de cuenta */}
      <div>
        <label style={labelStyle}>Estado de Cuenta</label>
        <button
          onClick={() => setBanned((v) => !v)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: `1px solid ${banned ? 'oklch(0.58 0.20 22 / 0.4)' : 'oklch(0.62 0.13 158 / 0.4)'}`,
            backgroundColor: banned ? 'var(--wf-danger-soft)' : 'var(--wf-safe-soft)',
            color: banned ? 'var(--wf-danger)' : 'var(--wf-safe-strong)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left',
          }}
        >
          {banned ? '● Deshabilitado — clic para activar' : '● Activo — clic para deshabilitar'}
        </button>
      </div>

      {/* Restablecer contraseña */}
      <div>
        <label style={labelStyle}>Restablecer Contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showNewPass ? 'text' : 'password'}
            value={newPass} onChange={(e) => setNewPass(e.target.value)}
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            style={{ ...inputStyle, paddingRight: 44 }}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowNewPass((v) => !v)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--wf-muted)', fontSize: 14, padding: 4,
          }}>
            {showNewPass ? '🙈' : '👁'}
          </button>
        </div>
        {resetError   && <p style={{ color: 'var(--wf-danger)',      fontSize: 12, margin: '6px 0 0' }}>{resetError}</p>}
        {resetSuccess && <p style={{ color: 'var(--wf-safe-strong)', fontSize: 12, margin: '6px 0 0' }}>{resetSuccess}</p>}
        <button className="btn-ghost" onClick={handleResetPassword}
          disabled={resetLoading || !newPass}
          style={{ width: '100%', justifyContent: 'center', marginTop: 8, opacity: !newPass ? 0.5 : 1 }}>
          {resetLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
        </button>
      </div>

      {/* Feedback guardar */}
      {error   && <p style={{ color: 'var(--wf-danger)',      fontSize: 12, margin: 0 }}>{error}</p>}
      {success && <p style={{ color: 'var(--wf-safe-strong)', fontSize: 12, margin: 0 }}>{success}</p>}

      <button className="btn-primary" onClick={handleSave} disabled={loading}
        style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>

      {!isSelf && (
        <button onClick={() => onDelete(user)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--wf-danger)', fontSize: 13, fontWeight: 700,
          textAlign: 'center', padding: '4px 0',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>
          Eliminar Acceso
        </button>
      )}
    </div>
  );
}

// ── Fila de usuario ───────────────────────────────────────────────────────────

interface UserRowProps {
  user:     AdminUser;
  index:    number;
  selected: boolean;
  onClick:  () => void;
}

function UserRow({ user, index, selected, onClick }: UserRowProps) {
  const status   = getUserStatus(user);
  const name     = getDisplayName(user.email, user.full_name);
  const initials = getInitials(user.email, user.full_name);

  const statusColor = status === 'Activo'
    ? { bg: 'var(--wf-safe-soft)',  color: 'var(--wf-safe-strong)' }
    : status === 'Deshabilitado'
    ? { bg: 'var(--wf-danger-soft)', color: 'var(--wf-danger)' }
    : { bg: 'var(--wf-warn-soft)',   color: 'oklch(0.52 0.10 70)' };

  return (
    <tr onClick={onClick} style={{
      cursor: 'pointer',
      backgroundColor: selected ? 'var(--wf-primary-soft)' : 'transparent',
      transition: 'background 0.12s',
    }}>
      <td style={{ padding: '13px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="avatar" style={{ fontSize: 12, width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--wf-ink)', fontSize: 13, fontWeight: 700 }}>{name}</p>
            <p style={{ margin: '2px 0 0', color: 'var(--wf-muted)', fontSize: 11 }}>{user.email}</p>
          </div>
        </div>
      </td>
      <td style={{ padding: '13px 12px', color: 'var(--wf-faint)', fontSize: 12, fontFamily: 'var(--wf-mono)', whiteSpace: 'nowrap' }}>
        {formatRutina(index)}
      </td>
      <td style={{ padding: '13px 12px' }}>
        <span className={`chip ${user.is_admin ? 'blue' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          {LEVEL_LABELS[user.level] ?? 'Estándar'}
        </span>
      </td>
      <td style={{ padding: '13px 12px', fontSize: 12, fontWeight: 600,
        color: user.permissions?.create_users ? 'var(--wf-safe-strong)' : 'var(--wf-faint)' }}>
        {user.permissions?.create_users ? 'Sí' : 'No'}
      </td>
      <td style={{ padding: '13px 12px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          backgroundColor: statusColor.bg, color: statusColor.color,
        }}>
          {status}
        </span>
      </td>
    </tr>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminUsersPanel() {
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

  const selected = users.find((u) => u.id === selectedId) ?? null;

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) ||
      getDisplayName(u.email, u.full_name).toLowerCase().includes(q) ||
      (LEVEL_LABELS[u.level] ?? '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleSaved = useCallback(() => {
    fetchUsers();
    setSuccessMsg('Cambios guardados.');
    setTimeout(() => setSuccessMsg(''), 3000);
  }, [fetchUsers]);

  const handleDeleteConfirm = async () => {
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
  };

  const activeCount = users.filter((u) => !u.banned).length;

  return (
    <div>
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            fetchUsers();
            setSuccessMsg('Usuario creado correctamente.');
            setTimeout(() => setSuccessMsg(''), 4000);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Directorio de Usuarios Corporativos</h2>
          <p className="text-muted">
            {loading ? 'Cargando...' : `${activeCount} activo${activeCount !== 1 ? 's' : ''} · ${users.length} total`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          + Crear Nuevo Usuario
        </button>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: 'var(--wf-safe-soft)', border: '1px solid oklch(0.62 0.13 158 / 0.35)',
          color: 'var(--wf-safe-strong)', padding: '12px 16px', borderRadius: 10,
          marginBottom: 16, fontSize: 13, fontWeight: 600,
        }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          backgroundColor: 'var(--wf-danger-soft)', border: '1px solid oklch(0.58 0.20 22 / 0.25)',
          color: 'var(--wf-danger)', padding: '12px 16px', borderRadius: 10,
          marginBottom: 16, fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        {/* Input trampa: absorbe el autofill del browser */}
        <input type="text" aria-hidden="true" tabIndex={-1} readOnly
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, padding: 0, border: 0 }} />
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--wf-faint)', fontSize: 15, pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o rol..."
          autoComplete="new-password"
          spellCheck={false}
          style={{ ...inputStyle, paddingLeft: 40, boxShadow: 'var(--wf-shadow-sm)' }}
        />
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--wf-muted)' }}>
            <p style={{ fontSize: 14 }}>Cargando usuarios...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--wf-faint)' }}>
            <p style={{ fontSize: 14 }}>{search ? 'Sin resultados para la búsqueda' : 'No hay usuarios en el sistema'}</p>
          </div>
        ) : (
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Nombre</th>
                <th>Rutina</th>
                <th>Rol</th>
                <th>Perm. Creación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <UserRow
                  key={u.id}
                  user={u}
                  index={i}
                  selected={selected?.id === u.id}
                  onClick={() => setSelectedId(u.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer lateral */}
      {selected && (
        <>
          {/* Backdrop solo visual — no bloquea clicks en la tabla */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.18)',
            backdropFilter: 'blur(2px)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
            width: 360,
            backgroundColor: 'var(--wf-surface)',
            borderLeft: '1px solid var(--wf-line)',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.10)',
            overflowY: 'auto',
            padding: '28px 24px',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: 'var(--wf-ink)', fontSize: 15, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.3px' }}>
                  {getDisplayName(selected.email, selected.full_name)}
                </h3>
                <p style={{ color: 'var(--wf-muted)', fontSize: 12, margin: 0 }}>{selected.email}</p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                style={{
                  background: 'none', border: '1px solid var(--wf-line)', cursor: 'pointer',
                  color: 'var(--wf-muted)', fontSize: 18, lineHeight: 1, padding: '4px 9px', borderRadius: 8,
                }}
              >
                ×
              </button>
            </div>
            <EditPanel
              key={selectedId}
              user={selected}
              onSaved={handleSaved}
              onDelete={setDeleteTarget}
              isSelf={selected.id === currentUserId}
              hideHeader
            />
          </div>
        </>
      )}

      <style jsx global>{panelStyles}</style>
    </div>
  );
}
