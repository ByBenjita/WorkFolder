'use client';

import React, { useState } from 'react';
import { useAdminBoveda, formatFileSize, formatDate } from './useAdminBoveda';
import type { AdminDocumentMetadata } from './useAdminBoveda';
import { adminBovedaPanelStyles } from './AdminBovedaPanel.styles';
import { panelStyles } from '../EnterprisePanel/EnterprisePanel.styles';

// ── Iconos de línea para ABP (reutilizables en todo el panel) ─────────────────────────
const ABP_ICONS = {
  shieldKey: (<><path d="M12 3 5 6v6c0 4.2 2.9 7.4 7 8.7 4.1-1.3 7-4.5 7-8.7V6z" />
  <circle cx="12" cy="11" r="2" />
  <path d="M12 13v3" /></>),
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" />
  <path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  key: (<><circle cx="8" cy="15" r="4" />
  <path d="m10.8 12.2 7-7" />
  <path d="m17 5 2.5 2.5" /><
    path d="m14.5 7.5 2 2" /></>),
};

const ABPIcon = ({ n, w = 16, s = 2 }: { n: keyof typeof ABP_ICONS; w?: number; s?: number }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={s} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}>
    {ABP_ICONS[n]}
  </svg>
);

// ── Modal: restablecer clave (admin) ──────────────────────────────
interface AdminResetKeyModalProps {
  isOpen:    boolean;
  fileName:  string;
  userEmail: string;
  onConfirm: (newKey: string) => void;
  onCancel:  () => void;
  loading:   boolean;
  error:     string;
}

function AdminResetKeyModal({
  isOpen, fileName, userEmail, onConfirm, onCancel, loading, error,
}: AdminResetKeyModalProps) {
  const [newKey,   setNewKey]   = useState('');
  const [showKey,  setShowKey]  = useState(false);
  const [keyError, setKeyError] = useState('');

  const reset = () => { setNewKey(''); setShowKey(false); setKeyError(''); };

  const handleCancel = () => { reset(); onCancel(); };

  const handleConfirm = () => {
    if (newKey.length < 8) { setKeyError('La clave debe tener al menos 8 caracteres'); return; }
    setKeyError('');
    onConfirm(newKey);
  };

  if (!isOpen) return null;

  return (
    <div className="abp-modal-overlay">
      <div className="abp-modal-box">

        <div className="abp-modal-icon">A</div>

        <h3 className="abp-modal-title">Restablecer clave de cifrado</h3>
        <p className="abp-modal-subtitle">Accion de administrador</p>
        <p className="abp-modal-desc">
          Archivo: <strong>{fileName}</strong><br />
          <span className="abp-modal-user-email">Usuario: {userEmail}</span>
        </p>

        <div className="abp-modal-warning">
          Esta accion es irreversible. El archivo sera re-cifrado con la nueva clave. El usuario debera usar la nueva clave para acceder al archivo.
        </div>

        <label className="abp-input-label">Nueva clave</label>
        <div className="abp-input-wrapper">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="Minimo 8 caracteres"
            value={newKey}
            onChange={(e) => { setNewKey(e.target.value); setKeyError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
            className={`abp-input${keyError ? ' abp-input-error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            tabIndex={-1}
            className="abp-toggle-btn"
          >
            {showKey ? 'ocultar' : 'ver'}
          </button>
        </div>

        {keyError && <p className="abp-field-error">{keyError}</p>}
        {error    && <p className="abp-field-error">{error}</p>}

        <div className="abp-modal-actions">
          <button onClick={handleCancel} disabled={loading} className="abp-btn-cancel">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || newKey.length < 8}
            className="abp-btn-confirm"
          >
            {loading ? 'Procesando...' : 'Restablecer clave'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export default function AdminBovedaPanel() {
  const { documents, loading, error, adminRekey } = useAdminBoveda();

  const [resetTarget,  setResetTarget]  = useState<AdminDocumentMetadata | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');

  const handleResetConfirm = async (newKey: string) => {
    if (!resetTarget) return;
    setResetLoading(true);
    setResetError('');

    const result = await adminRekey(resetTarget.id, newKey);
    if (result.success) {
      setResetTarget(null);
      setSuccessMsg(`Clave restablecida correctamente para "${resetTarget.nombre_original}"`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setResetError(result.error || 'Error al restablecer la clave');
    }
    setResetLoading(false);
  };

  return (
    <div className="abp-root">
      <AdminResetKeyModal
        isOpen={resetTarget !== null}
        fileName={resetTarget?.nombre_original || ''}
        userEmail={resetTarget?.user_email || ''}
        onConfirm={handleResetConfirm}
        onCancel={() => { setResetTarget(null); setResetError(''); }}
        loading={resetLoading}
        error={resetError}
      />

      <div className="abp-head">
        <div className="abp-badge"><ABPIcon n="shieldKey" w={22} s={1.9} /></div>
        <div>
          <h2 className="abp-title">
            Gestión de Bóveda
            <span className="abp-pill">Administrador</span>
          </h2>
          <p className="abp-desc">
            Vista de todos los documentos cifrados del sistema. El administrador puede restablecer la clave de cualquier archivo.
          </p>
        </div>
      </div>

      {successMsg && <div className="abp-success-msg">{successMsg}</div>}

      {error && (
        <div className={error.includes('insuficientes') ? 'abp-error-perm' : 'abp-error-generic'}>
          {error.includes('insuficientes') ? (
            <>
              <p className="abp-perm-title">
                Acceso restringido — Permisos de administrador requeridos
              </p>
              <p className="abp-perm-text">
                Esta seccion solo es accesible para administradores del sistema. Contacta al administrador actual o asigna el rol desde el panel de Supabase o desde la seccion de Usuarios.
              </p>
            </>
          ) : (
            <p>{error}</p>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Todos los documentos cifrados</h3>
            <p className="text-muted mt-8">
              {loading
                ? 'Cargando...'
                : `Total: ${documents.length} documento${documents.length !== 1 ? 's' : ''} en el sistema`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="abp-loading-box">Cargando documentos...</div>
        ) : documents.length === 0 ? (
          <div className="abp-empty-box">No hay documentos en el sistema</div>
        ) : (
          documents.map((doc, idx) => (
            <div key={doc.id} className="item-row">
              <div className="item-left">
                <div className={`abp-doc-icon ${idx % 2 === 0 ? 'av-1' : 'av-2'}`}>
                  {(doc.user_email?.[0] || 'U').toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="file-name-row">
                    <p className="file-name" title={doc.nombre_original}
                      style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.nombre_original}
                    </p>
                    <span className="tag-cifrado"><ABPIcon n="lock" w={10} s={2.4} />Cifrado</span>
                  </div>
                  <p className="file-meta">
                    {formatFileSize(doc.tamano_bytes)} · {formatDate(doc.creado_en)} · <span className="abp-doc-owner">{doc.user_email}</span>
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost abp-btn-reset"
                onClick={() => { setResetError(''); setResetTarget(doc); }}
              >
                <ABPIcon n="key" w={14} />Restablecer clave
              </button>
            </div>
          ))
        )}
      </div>

      <style jsx global>{panelStyles}</style>
      <style jsx global>{adminBovedaPanelStyles}</style>
    </div>
  );
}
  