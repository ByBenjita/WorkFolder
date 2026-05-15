'use client';

import React, { useState, useRef } from 'react';
import { useBoveda } from '@/hooks/useBoveda';
import { panelStyles } from "../../admin/enterprise-panel/components/EnterprisePanel/EnterprisePanel.styles";

interface Props {
  section: 'boveda';
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">{children}</div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="section-title">{children}</h2>
);

const Stat = ({ label, value, sub, accent }: {
  label: string; value: string; sub: string; accent?: boolean;
}) => (
  <div className={`stat-card ${accent ? 'accent' : ''}`}>
    <p className="stat-label">{label}</p>
    <p className={`stat-value ${accent ? 'accent' : ''}`}>{value}</p>
    <p className="stat-sub">{sub}</p>
  </div>
);

// ── Modal de clave ────────────────────────────────────────────────
interface KeyModalProps {
  isOpen:       boolean;
  title:        string;
  description:  string;
  confirmLabel: string;
  onConfirm:    (key: string) => void;
  onCancel:     () => void;
}

function KeyModal({ isOpen, title, description, confirmLabel, onConfirm, onCancel }: KeyModalProps) {
  const [key, setKey]           = useState('');
  const [show, setShow]         = useState(false);
  const [keyError, setKeyError] = useState('');

  const handleConfirm = () => {
    if (key.length < 8) {
      setKeyError('La clave debe tener al menos 8 caracteres');
      return;
    }
    setKeyError('');
    onConfirm(key);
    setKey('');
    setShow(false);
  };

  const handleCancel = () => {
    setKey('');
    setShow(false);
    setKeyError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        {/* Icono */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, margin: '0 auto 16px',
        }}>🔑</div>

        <h3 style={{ color: '#111827', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
          {description}
        </p>

        {/* Input clave */}
        <label style={{
          display: 'block', color: '#374151', fontSize: 12,
          fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Clave de cifrado
        </label>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            type={show ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={key}
            onChange={(e) => { setKey(e.target.value); setKeyError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1px solid ${keyError ? '#fca5a5' : '#d1d5db'}`,
              borderRadius: 8, padding: '10px 44px 10px 12px',
              fontSize: 14, outline: 'none', color: '#111827',
              backgroundColor: keyError ? '#fef2f2' : '#f9fafb',
            }}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            tabIndex={-1}
            style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent', border: 'none',
              cursor: 'pointer', color: '#9ca3af', fontSize: 16,
            }}
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>

        {keyError && (
          <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
            {keyError}
          </p>
        )}

        {/* Aviso */}
        <div style={{
          backgroundColor: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 8, padding: '10px 12px', marginBottom: 20,
          fontSize: 12, color: '#92400e', lineHeight: 1.5,
        }}>
          ⚠️ <strong>Guarda tu clave en un lugar seguro.</strong> Sin ella no podrás acceder al archivo.
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleCancel}
            style={{
              flex: 1, padding: '10px', borderRadius: 8,
              border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
              color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={key.length < 8}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              backgroundColor: key.length >= 8 ? '#3b82f6' : '#e5e7eb',
              color: key.length >= 8 ? '#ffffff' : '#9ca3af',
              fontWeight: 700, fontSize: 13,
              cursor: key.length >= 8 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sección Bóveda ────────────────────────────────────────────────
function BovedaSection() {
  const { documents, loading, error, uploadFile, deleteFile, downloadFile, uploading } = useBoveda();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [uploadError,  setUploadError]  = useState<string | null>(null);

  // ── Estado de modales ─────────────────────────────────────────
  const [pendingFile,      setPendingFile]      = useState<File | null>(null);
  const [downloadTarget,   setDownloadTarget]   = useState<{ id: string; name: string } | null>(null);
  const [uploadModalOpen,  setUploadModalOpen]  = useState(false);
  const [downloadModalOpen,setDownloadModalOpen]= useState(false);

  // ── Helpers ───────────────────────────────────────────────────
  const totalSize   = documents.reduce((acc, doc) => acc + doc.tamano_bytes, 0);
  const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf'))                                    return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel'))   return '📊';
    if (mimeType.includes('presentation'))                           return '🎞️';
    if (mimeType.includes('image'))                                  return '🖼️';
    if (mimeType.includes('video'))                                  return '🎥';
    if (mimeType.includes('audio'))                                  return '🎵';
    return '📦';
  };

  // ── Flujo subida ──────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`Archivo demasiado grande. Máximo 100MB (tu archivo: ${formatFileSize(file.size)})`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPendingFile(file);
    setUploadModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadConfirm = async (userKey: string) => {
    if (!pendingFile) return;
    setUploadModalOpen(false);

    const success = await uploadFile(pendingFile, userKey);
    if (!success) setUploadError(error || 'Error al subir el archivo');
    setPendingFile(null);
  };

  // ── Flujo descarga ────────────────────────────────────────────
  const handleDownloadClick = (documentId: string, fileName: string) => {
    setDownloadTarget({ id: documentId, name: fileName });
    setDownloadModalOpen(true);
  };

  const handleDownloadConfirm = async (userKey: string) => {
    if (!downloadTarget) return;
    setDownloadModalOpen(false);
    await downloadFile(downloadTarget.id, downloadTarget.name, userKey);
    setDownloadTarget(null);
  };

  // ── Flujo eliminación ─────────────────────────────────────────
  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) return;
    setDeletingId(documentId);
    const success = await deleteFile(documentId);
    if (!success) setUploadError(error || 'Error al eliminar el documento');
    setDeletingId(null);
  };

  return (
    <div>
      <SectionTitle>Bóveda Enterprise</SectionTitle>

      {/* Modales */}
      <KeyModal
        isOpen={uploadModalOpen}
        title="Establecer clave de cifrado"
        description={`Define una clave única para cifrar "${pendingFile?.name}". Necesitarás esta clave para descargarlo después.`}
        confirmLabel="Cifrar y subir"
        onConfirm={handleUploadConfirm}
        onCancel={() => { setUploadModalOpen(false); setPendingFile(null); }}
      />

      <KeyModal
        isOpen={downloadModalOpen}
        title="Ingresar clave de descifrado"
        description={`Ingresa la clave que usaste al subir "${downloadTarget?.name}".`}
        confirmLabel="Descifrar y descargar"
        onConfirm={handleDownloadConfirm}
        onCancel={() => { setDownloadModalOpen(false); setDownloadTarget(null); }}
      />

      {/* Stats */}
      <div className="stats-row">
        <Stat label="Almacenamiento" value={`${totalSizeGB} GB`} sub="de 1 TB usado" />
        <Stat label="Archivos" value={documents.length.toString()} sub="documentos guardados" accent />
        <Stat
          label="Últimos 30 días"
          value={documents.filter(d => {
            const ago = new Date(); ago.setDate(ago.getDate() - 30);
            return new Date(d.creado_en) > ago;
          }).length.toString()}
          sub="documentos nuevos"
        />
      </div>

      {/* Error */}
      {(uploadError || error) && (
        <div style={{
          backgroundColor: '#fee2e2', border: '1px solid #fecaca',
          color: '#991b1b', padding: '12px 16px', borderRadius: 6,
          marginBottom: 16, fontSize: 14,
        }}>
          ⚠️ {uploadError || error}
        </div>
      )}

      {/* Archivos */}
      <Card>
        <div className="card-header">
          <div>
            <h3 className="card-title">📁 Archivos Almacenados</h3>
            <p className="text-muted mt-8">
              {loading ? 'Cargando documentos...' : `Total: ${documents.length} archivo${documents.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ opacity: uploading ? 0.7 : 1 }}
          >
            {uploading ? '⏳ Subiendo...' : '↑ Subir Archivo'}
          </button>
          <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: 'none' }} disabled={uploading} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Cargando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>📭 No tienes documentos aún</p>
            <p style={{ fontSize: 13, color: '#d1d5db' }}>Sube tu primer documento usando el botón de arriba</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="item-row">
              <div className="item-left">
                <div className="file-icon">{getFileIcon(doc.tipo_mime)}</div>
                <div>
                  <p className="file-name" title={doc.nombre_original}
                    style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.nombre_original}
                  </p>
                  <p className="file-meta">{formatFileSize(doc.tamano_bytes)} · {formatDate(doc.creado_en)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn-ghost"
                  onClick={() => handleDownloadClick(doc.id, doc.nombre_original)}
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  ⬇️ Descargar
                </button>
                <button className="btn-ghost"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  style={{ padding: '6px 12px', fontSize: 13, color: deletingId === doc.id ? '#9ca3af' : '#ef4444' }}
                >
                  {deletingId === doc.id ? '⏳' : '🗑️'} Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      <div className="status-bar">
        <span className="green-dot">●</span>
        Encriptación E2EE activa · Todos los documentos están seguros
      </div>

      <style jsx global>{panelStyles}</style>
    </div>
  );
}

export default function BovedaPanel() {
  return <BovedaSection />;
}