'use client';

import React, { useState, useRef } from 'react';
import { useBoveda } from '@/hooks/useBoveda';
import { panelStyles } from "../../admin/enterprise-panel/components/EnterprisePanel/EnterprisePanel.styles";

interface Props {
  section: 'boveda';
}

// ────────────────────────────────────────────────────────────────
// Componentes reutilizables
// ────────────────────────────────────────────────────────────────

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">{children}</div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="section-title">{children}</h2>
);

const Stat = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) => (
  <div className={`stat-card ${accent ? 'accent' : ''}`}>
    <p className="stat-label">{label}</p>
    <p className={`stat-value ${accent ? 'accent' : ''}`}>{value}</p>
    <p className="stat-sub">{sub}</p>
  </div>
);

// ────────────────────────────────────────────────────────────────
// Sección Bóveda
// ────────────────────────────────────────────────────────────────

function BovedaSection() {
  const {
    documents,
    loading,
    error,
    uploadFile,
    deleteFile,
    downloadFile,
    uploading,
  } = useBoveda();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Calcular estadísticas
  const totalSize = documents.reduce((acc, doc) => acc + doc.tamano_bytes, 0);
  const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);

  /**
   * Formatear tamaño de bytes a formato legible
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Formatear fecha
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Obtener icono según tipo MIME
   */
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document'))
      return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel'))
      return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return '🎞️';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('compressed'))
      return '📦';
    return '📦';
  };

  /**
   * Manejar selección de archivo
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validar tamaño (máximo 100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(
        `Archivo demasiado grande. Máximo 100MB (tu archivo: ${formatFileSize(file.size)})`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const success = await uploadFile(file);

    if (success) {
      // Limpiar input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setUploadError(error || 'Error al subir el archivo');
    }
  };

  /**
   * Manejar eliminación
   */
  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?'))
      return;

    setDeletingId(documentId);
    const success = await deleteFile(documentId);

    if (!success) {
      setUploadError(error || 'Error al eliminar el documento');
    }

    setDeletingId(null);
  };

  /**
   * Manejar descarga
   */
  const handleDownload = (documentId: string, fileName: string) => {
    downloadFile(documentId, fileName);
  };

  return (
    <div>
      <SectionTitle>Bóveda Enterprise</SectionTitle>

      {/* Estadísticas */}
      <div className="stats-row">
        <Stat
          label="Almacenamiento"
          value={`${totalSizeGB} GB`}
          sub="de 1 TB usado"
        />
        <Stat
          label="Archivos"
          value={documents.length.toString()}
          sub="documentos guardados"
          accent
        />
        <Stat
          label="Últimos 30 días"
          value={documents.filter((d) => {
            const date = new Date(d.creado_en);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return date > thirtyDaysAgo;
          }).length.toString()}
          sub="documentos nuevos"
        />
      </div>

      {/* Mensajes de error */}
      {(uploadError || error) && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          ⚠️ {uploadError || error}
        </div>
      )}

      {/* Área de carga */}
      <Card>
        <div className="card-header">
          <div>
            <h3 className="card-title">📁 Archivos Almacenados</h3>
            <p className="text-muted mt-8">
              {loading
                ? 'Cargando documentos...'
                : `Total: ${documents.length} archivo${documents.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? '⏳ Subiendo...' : '↑ Subir Archivo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </div>
        </div>

        {/* Documentos */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: '#6b7280',
            }}
          >
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              Cargando documentos...
            </p>
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 0.6s linear infinite',
              }}
            />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : documents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9ca3af',
            }}
          >
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              📭 No tienes documentos aún
            </p>
            <p style={{ fontSize: '13px', color: '#d1d5db' }}>
              Sube tu primer documento usando el botón de arriba
            </p>
          </div>
        ) : (
          <div>
            {documents.map((doc) => (
              <div key={doc.id} className="item-row">
                <div className="item-left">
                  <div className="file-icon">
                    {getFileIcon(doc.tipo_mime)}
                  </div>
                  <div>
                    <p
                      className="file-name"
                      title={doc.nombre_original}
                      style={{
                        maxWidth: '400px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.nombre_original}
                    </p>
                    <p className="file-meta">
                      {formatFileSize(doc.tamano_bytes)} · {formatDate(doc.creado_en)}
                    </p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <button
                    className="btn-ghost"
                    onClick={() =>
                      handleDownload(doc.id, doc.nombre_original)
                    }
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                    title="Descargar documento"
                  >
                    ⬇️ Descargar
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      color: deletingId === doc.id ? '#9ca3af' : '#ef4444',
                      opacity: deletingId === doc.id ? 0.6 : 1,
                    }}
                    title="Eliminar documento"
                  >
                    {deletingId === doc.id ? '⏳' : '🗑️'} Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Status bar */}
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