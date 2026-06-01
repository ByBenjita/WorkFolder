import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAccessToken } from '@/services/authApi';
import DocumentService, { AdminDocumentMetadata } from '@/services/documentService';

export type { AdminDocumentMetadata };

// ── Helpers de formato ────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Hook ──────────────────────────────────────────────────────────
export function useAdminBoveda() {
  const [documents, setDocuments] = useState<AdminDocumentMetadata[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const service = useMemo(
    () => new DocumentService('/api/documentos', getAccessToken),
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { documents: docs, error: err } = await service.adminListAllDocuments();
      if (err) {
        setError(err);
        setDocuments([]);
      } else {
        setDocuments(docs);
      }
    } catch {
      setError('Error de conexion al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { refresh(); }, [refresh]);

  const adminRekey = useCallback(
    async (documentId: string, newKey: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await service.adminRekeyDocument(documentId, newKey);
        return result;
      } catch {
        return { success: false, error: 'Error de conexion al restablecer la clave' };
      }
    },
    [service]
  );

  return { documents, loading, error, adminRekey };
}
