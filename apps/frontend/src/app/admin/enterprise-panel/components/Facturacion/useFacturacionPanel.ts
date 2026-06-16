import { useState, useEffect, useCallback } from 'react';
import {
  facturacionService,
  type Plan,
  type Suscripcion,
  type Factura,
  type PlanId,
} from '@/services/facturacionService';

export interface DatosContacto {
  nombre: string;
  rut: string;
  direccion: string;
  correo: string;
}

const DATOS_VACIO: DatosContacto = { nombre: '', rut: '', direccion: '', correo: '' };

export function useFacturacionPanel() {
  const [planes, setPlanes]           = useState<Plan[]>([]);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [facturas, setFacturas]       = useState<Factura[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [redirigiendo, setRedirigiendo] = useState(false);
  const [actionError, setActionError]   = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [confirmPlan, setConfirmPlan]   = useState<Plan | null>(null);
  const [modalStep, setModalStep]       = useState<1 | 2>(1);
  const [datosContacto, setDatosContacto] = useState<DatosContacto>(DATOS_VACIO);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [planesData, suscripcionData, facturasData] = await Promise.all([
        facturacionService.getPlanes(),
        facturacionService.getSuscripcion(),
        facturacionService.getFacturas(),
      ]);
      setPlanes(planesData);
      setSuscripcion(suscripcionData);
      setFacturas(facturasData);
    } catch {
      setError('No se pudieron cargar los datos de facturación.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Al volver de MP, sincroniza si hay preapproval_id en la URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const preapprovalId = params.get('preapproval_id');
    if (!preapprovalId) return;

    facturacionService
      .sincronizar(preapprovalId)
      .then((res) => {
        if (res.sincronizado) {
          fetchAll();
          setSuccessMsg('Plan actualizado correctamente con Mercado Pago.');
        } else {
          setSuccessMsg('Pago en procesamiento. El plan se actualizará en breve.');
        }
        const url = new URL(window.location.href);
        url.searchParams.delete('preapproval_id');
        url.searchParams.delete('status');
        url.searchParams.delete('external_reference');
        window.history.replaceState({}, '', url.toString());
      })
      .catch(() => {});
  }, [fetchAll]);

  function abrirModal(plan: Plan) {
    setModalStep(1);
    setDatosContacto(DATOS_VACIO);
    setActionError('');
    setConfirmPlan(plan);
  }

  function cerrarModal() {
    setConfirmPlan(null);
    setModalStep(1);
    setDatosContacto(DATOS_VACIO);
  }

  function avanzarPago() {
    setModalStep(2);
  }

  function volverDatos() {
    setModalStep(1);
  }

  function actualizarDato(key: keyof DatosContacto, value: string) {
    setDatosContacto((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSimularPago() {
    if (!confirmPlan) return;
    try {
      setRedirigiendo(true);
      setActionError('');
      setSuccessMsg('');
      await facturacionService.simularPago(confirmPlan.id);
      cerrarModal();
      await fetchAll();
      setSuccessMsg(`Plan ${confirmPlan.nombre} activado (simulación sandbox).`);
    } catch (e: unknown) {
      setRedirigiendo(false);
      setActionError(e instanceof Error ? e.message : 'Error al simular pago');
      cerrarModal();
    }
  }

  async function handleConfirmarCambio() {
    if (!confirmPlan) return;
    try {
      setRedirigiendo(true);
      setActionError('');
      setSuccessMsg('');

      const { sandbox_init_point, init_point } =
        await facturacionService.iniciarPago(confirmPlan.id, datosContacto.correo);

      cerrarModal();
      window.location.href = sandbox_init_point ?? init_point;
    } catch (e: unknown) {
      setRedirigiendo(false);
      setActionError(
        e instanceof Error ? e.message : 'Error al conectar con Mercado Pago'
      );
      cerrarModal();
    }
  }

  return {
    planes,
    suscripcion,
    facturas,
    loading,
    error,
    redirigiendo,
    actionError,
    successMsg,
    confirmPlan,
    modalStep,
    datosContacto,
    actualizarDato,
    abrirModal,
    cerrarModal,
    avanzarPago,
    volverDatos,
    handleConfirmarCambio,
    handleSimularPago,
  };
}
