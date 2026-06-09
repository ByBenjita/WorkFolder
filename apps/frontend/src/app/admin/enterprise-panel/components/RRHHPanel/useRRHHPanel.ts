'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { rrhhService, RRHHDocumento, TipoDocumento } from '@/services/rrhhService';
import { authApi, AdminUser } from '@/services/authApi';

export type FiltroTipo = 'all' | TipoDocumento;

export function useRRHHPanel() {
  const [documentos, setDocumentos]         = useState<RRHHDocumento[]>([]);
  const [usuarios, setUsuarios]             = useState<AdminUser[]>([]);
  const [isAdmin, setIsAdmin]               = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [filtro, setFiltro]                 = useState<FiltroTipo>('all');
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>('all');
  const [uploadOpen, setUploadOpen]         = useState(false);
  const [signTarget, setSignTarget]         = useState<RRHHDocumento | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<RRHHDocumento | null>(null);
  const [successMsg, setSuccessMsg]         = useState('');
  const [actionLoading, setActionLoading]   = useState(false);
  const [actionError, setActionError]       = useState('');

  const fetchDocumentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docsRes, usersRes] = await Promise.all([
        rrhhService.listDocumentos(),
        authApi.adminListUsers(),
      ]);
      if (docsRes.error) {
        setError(docsRes.error);
      } else {
        setDocumentos(docsRes.data);
        setIsAdmin(docsRes.isAdmin);
      }
      if (usersRes.success) {
        setUsuarios(usersRes.users);
      }
    } catch {
      setError('Error de conexión al cargar documentos RRHH');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocumentos(); }, [fetchDocumentos]);

  // Empleados únicos que tienen documentos asignados (para el filtro)
  const empleadosConDocs = useMemo(() => {
    const map = new Map<string, { id: string; email: string; nombre: string | null }>();
    documentos.forEach((d) => {
      if (!map.has(d.asignado_a)) {
        map.set(d.asignado_a, {
          id:     d.asignado_a,
          email:  d.asignado_a_email,
          nombre: d.asignado_a_nombre,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [documentos]);

  const filtrados = useMemo(() => {
    let result = documentos;
    if (filtro !== 'all')          result = result.filter((d) => d.tipo === filtro);
    if (filtroEmpleado !== 'all')  result = result.filter((d) => d.asignado_a === filtroEmpleado);
    return result;
  }, [documentos, filtro, filtroEmpleado]);

  const stats = useMemo(() => ({
    total:      documentos.length,
    pendientes: documentos.filter((d) => d.estado === 'pendiente').length,
    firmados:   documentos.filter((d) => d.estado === 'firmado').length,
  }), [documentos]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  }

  const handleUpload = useCallback(async (
    file:      File,
    asignadoA: string,
    tipo:      TipoDocumento,
    periodo?:  string
  ) => {
    const usuario = usuarios.find((u) => u.id === asignadoA);
    if (!usuario) return;
    setActionLoading(true);
    setActionError('');
    const res = await rrhhService.uploadDocumento(
      file,
      asignadoA,
      usuario.email,
      usuario.full_name ?? null,
      tipo,
      periodo
    );
    setActionLoading(false);
    if (res.success) {
      setUploadOpen(false);
      showSuccess('Documento asignado correctamente.');
      fetchDocumentos();
    } else {
      setActionError(res.error ?? 'Error al subir el documento');
    }
  }, [usuarios, fetchDocumentos]);

  const handleSign = useCallback(async () => {
    if (!signTarget) return;
    setActionLoading(true);
    setActionError('');
    const res = await rrhhService.firmarDocumento(signTarget.id);
    setActionLoading(false);
    if (res.success) {
      setSignTarget(null);
      showSuccess('Documento firmado correctamente.');
      fetchDocumentos();
    } else {
      setActionError(res.error ?? 'Error al firmar el documento');
    }
  }, [signTarget, fetchDocumentos]);

  const handleDownload = useCallback(async (doc: RRHHDocumento) => {
    try {
      await rrhhService.downloadDocumento(doc.id, doc.nombre_original);
    } catch (e) {
      setActionError((e as Error).message ?? 'Error al descargar');
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setActionError('');
    const res = await rrhhService.eliminarDocumento(deleteTarget.id);
    setActionLoading(false);
    if (res.success) {
      setDeleteTarget(null);
      showSuccess('Documento eliminado correctamente.');
      fetchDocumentos();
    } else {
      setActionError(res.error ?? 'Error al eliminar el documento');
    }
  }, [deleteTarget, fetchDocumentos]);

  return {
    documentos: filtrados,
    usuarios,
    isAdmin,
    empleadosConDocs,
    loading,
    error,
    filtro,
    setFiltro,
    filtroEmpleado,
    setFiltroEmpleado,
    uploadOpen,
    setUploadOpen,
    signTarget,
    setSignTarget,
    deleteTarget,
    setDeleteTarget,
    successMsg,
    actionLoading,
    actionError,
    setActionError,
    stats,
    fetchDocumentos,
    handleUpload,
    handleSign,
    handleDelete,
    handleDownload,
  };
}
