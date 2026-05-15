/**
 * Hook para manejar la lógica de documentos en la bóveda
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../usuarios/src/services/supabase';
import DocumentService, { DocumentMetadata } from '../services/documentService';

interface UseBovedaReturn {
  documents: DocumentMetadata[];
  loading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<boolean>;
  deleteFile: (documentId: string) => Promise<boolean>;
  downloadFile: (documentId: string, fileName: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  uploading: boolean;
}

export function useBoveda(): UseBovedaReturn {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

  // Instancia del servicio
  const documentService = useMemo(
    () => new DocumentService(API_URL, supabase),
    [API_URL]
  );

  // Manejo de Sesión
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUserId(session?.user?.id || null);
        if (!session) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUserId(session?.user?.id || null);
        if (!session) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Cargar documentos
  const refreshDocuments = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { documents: docs, error: err } = await documentService.listDocuments(userId);
      if (err) {
        setError(err);
        setDocuments([]);
      } else {
        const sorted = [...docs].sort(
          (a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
        );
        setDocuments(sorted);
      }
    } catch (e) {
      setError('Error de conexión al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [userId, documentService]);

  useEffect(() => {
    if (userId) refreshDocuments();
  }, [userId, refreshDocuments]);

  // Subir archivo
  const uploadFile = useCallback(
    async (file: File): Promise<boolean> => {
      if (!userId) {
        setError('Usuario no autenticado');
        return false;
      }

      setUploading(true);
      setError(null);

      try {
        const result = await documentService.uploadDocument(file, userId);
        if (result.success && result.data) {
          setDocuments((prev) => [result.data!, ...prev]);
          return true;
        } else {
          setError(result.error || 'Error al subir archivo');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        return false;
      } finally {
        setUploading(false);
      }
    },
    [userId, documentService]
  );

  // Eliminar archivo
  const deleteFile = useCallback(
    async (documentId: string): Promise<boolean> => {
      setError(null);
      try {
        const result = await documentService.deleteDocument(documentId);
        if (result.success) {
          setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
          return true;
        } else {
          setError(result.error || 'Error al eliminar archivo');
          return false;
        }
      } catch (err) {
        setError('No se pudo eliminar el archivo');
        return false;
      }
    },
    [documentService]
  );

  // Descargar archivo
  const downloadFile = useCallback(
    async (documentId: string, fileName: string): Promise<void> => {
      setError(null);
      try {
        const blob = await documentService.downloadDocument(documentId);
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          setError('No se pudo descargar el archivo');
        }
      } catch (err) {
        setError('Error en la descarga');
      }
    },
    [documentService]
  );

  return {
    documents,
    loading,
    error,
    uploadFile,
    deleteFile,
    downloadFile,
    refreshDocuments,
    uploading,
  };
}