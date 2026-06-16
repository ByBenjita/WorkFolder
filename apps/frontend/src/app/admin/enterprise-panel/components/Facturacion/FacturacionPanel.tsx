'use client';

import React from 'react';
import { useFacturacionPanel, type DatosContacto } from './useFacturacionPanel';
import { facturacionStyles } from './FacturacionPanel.styles';
import type { Plan, PlanId, Factura } from '@/services/facturacionService';

// ── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_ORDER: PlanId[] = ['startup', 'business', 'enterprise'];

function getLabelBoton(planId: PlanId, planActual: PlanId, nombre: string): string {
  if (planId === planActual) return 'PLAN ACTUAL';
  const idxActual   = PLAN_ORDER.indexOf(planActual);
  const idxObjetivo = PLAN_ORDER.indexOf(planId);
  return idxObjetivo > idxActual ? `MEJORAR A ${nombre.toUpperCase()}` : 'CONTRATAR AHORA';
}

function formatPeriodo(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
}

function chipClass(estado: Factura['estado']): string {
  if (estado === 'pagado')   return 'fact-chip-pagado';
  if (estado === 'pendiente') return 'fact-chip-pendiente';
  return 'fact-chip-fallido';
}

function chipLabel(estado: Factura['estado']): string {
  if (estado === 'pagado')   return 'Pagado';
  if (estado === 'pendiente') return 'Pendiente';
  return 'Fallido';
}

// ── Tarjeta de plan ──────────────────────────────────────────────────────────

function PlanCard({
  plan,
  planActual,
  onSolicitarCambio,
  actionLoading,
}: {
  plan: Plan;
  planActual: PlanId;
  onSolicitarCambio: (plan: Plan) => void;
  actionLoading: boolean;
}) {
  const esCurrent = plan.id === planActual;

  const nameClass =
    plan.id === 'startup'    ? 'primary' :
    plan.id === 'enterprise' ? 'safe'    : '';

  const btnClass =
    esCurrent                ? 'current' :
    plan.id === 'enterprise' ? 'safe'    : 'neutral';

  return (
    <div className={`fact-plan-card ${esCurrent ? 'current' : ''}`}>
      <h3 className={`fact-plan-name ${nameClass}`}>
        {plan.nombre.toUpperCase()}
      </h3>

      <div className="fact-plan-price">
        <span className="fact-price-main">U${plan.precio_mensual} / mes</span>
        <span className="fact-price-iva">(+{plan.iva_porcentaje}% IVA)</span>
      </div>

      <hr className="fact-separator" />

      <ul className="fact-features">
        {plan.caracteristicas.map((f) => (
          <li key={f}>{'✓'} {f}</li>
        ))}
      </ul>

      {plan.modulo_rrhh && (
        <div className="fact-rrhh-block">
          <p className="fact-rrhh-title">{plan.modulo_rrhh.titulo}</p>
          {plan.modulo_rrhh.extras.map((e) => (
            <p key={e} className="fact-rrhh-extra">{e}</p>
          ))}
        </div>
      )}

      <button
        className={`fact-btn ${btnClass}`}
        disabled={esCurrent || actionLoading}
        onClick={() => onSolicitarCambio(plan)}
      >
        {getLabelBoton(plan.id, planActual, plan.nombre)}
      </button>
    </div>
  );
}

// ── Paso 1: Datos de contacto ────────────────────────────────────────────────

function DatosContactoStep({
  datos,
  onCambio,
  onSiguiente,
  onCancelar,
}: {
  datos: DatosContacto;
  onCambio: (key: keyof DatosContacto, value: string) => void;
  onSiguiente: () => void;
  onCancelar: () => void;
}) {
  const valido =
    datos.nombre.trim() !== '' &&
    datos.rut.trim() !== '' &&
    datos.direccion.trim() !== '' &&
    datos.correo.trim() !== '';

  return (
    <>
      <h2 className="fact-modal-title">Datos de contacto</h2>
      <p className="fact-modal-sub">
        Completa tus datos para la emisión de la factura.
      </p>

      <div className="fact-form-group">
        <label className="fact-form-label">Nombre completo</label>
        <input
          className="fact-form-input"
          type="text"
          value={datos.nombre}
          onChange={(e) => onCambio('nombre', e.target.value)}
          placeholder="Ej: Juan Pérez"
        />
      </div>

      <div className="fact-form-group">
        <label className="fact-form-label">RUT</label>
        <input
          className="fact-form-input"
          type="text"
          value={datos.rut}
          onChange={(e) => onCambio('rut', e.target.value)}
          placeholder="Ej: 12.345.678-9"
        />
      </div>

      <div className="fact-form-group">
        <label className="fact-form-label">Dirección de facturación</label>
        <input
          className="fact-form-input"
          type="text"
          value={datos.direccion}
          onChange={(e) => onCambio('direccion', e.target.value)}
          placeholder="Ej: Av. Providencia 1234, Santiago"
        />
      </div>

      <div className="fact-form-group">
        <label className="fact-form-label">Correo electrónico</label>
        <input
          className="fact-form-input"
          type="email"
          value={datos.correo}
          onChange={(e) => onCambio('correo', e.target.value)}
          placeholder="Ej: contacto@empresa.com"
        />
      </div>

      <div className="fact-modal-footer">
        <button className="fact-btn-cancel" onClick={onCancelar}>
          Cancelar
        </button>
        <button
          className="fact-btn-confirm"
          onClick={onSiguiente}
          disabled={!valido}
        >
          Siguiente
        </button>
      </div>
    </>
  );
}

// ── Paso 2: Elegir método de pago ────────────────────────────────────────────

function ElegirPagoStep({
  plan,
  redirigiendo,
  onSeleccionarMP,
  onSimular,
  onVolver,
}: {
  plan: Plan;
  redirigiendo: boolean;
  onSeleccionarMP: () => void;
  onSimular: () => void;
  onVolver: () => void;
}) {
  return (
    <>
      <h2 className="fact-modal-title">Elegir método de pago</h2>
      <p className="fact-modal-sub">
        Plan <strong style={{ color: '#f0f0f5' }}>{plan.nombre}</strong> — U${plan.precio_mensual}/mes (+{plan.iva_porcentaje}% IVA)
      </p>

      <button
        className={`fact-payment-option ${redirigiendo ? 'loading' : ''}`}
        onClick={onSeleccionarMP}
        disabled={redirigiendo}
      >
        <div className="fact-payment-logo-col">
          <span className="fact-payment-logo-text">MP</span>
        </div>
        <div className="fact-payment-info">
          <span className="fact-payment-name">Mercado Pago</span>
          <span className="fact-payment-desc">
            {redirigiendo
              ? 'Redirigiendo a Mercado Pago...'
              : 'Suscripción mensual automática'}
          </span>
        </div>
        <span className="fact-payment-arrow" aria-hidden>›</span>
      </button>

      <button
        className="fact-payment-option-sim"
        onClick={onSimular}
        disabled={redirigiendo}
      >
        <div className="fact-payment-logo-col sim">
          <span className="fact-payment-logo-text">SIM</span>
        </div>
        <div className="fact-payment-info">
          <span className="fact-payment-name">Simular pago</span>
          <span className="fact-payment-desc">
            Activa el plan directamente — solo disponible en sandbox
          </span>
        </div>
        <span className="fact-payment-arrow" aria-hidden>›</span>
      </button>

      <div className="fact-modal-footer">
        <button
          className="fact-btn-cancel"
          onClick={onVolver}
          disabled={redirigiendo}
        >
          Volver
        </button>
      </div>
    </>
  );
}

// ── Modal de dos pasos ───────────────────────────────────────────────────────

function PasoModal({
  plan,
  modalStep,
  datosContacto,
  redirigiendo,
  onCambio,
  onSiguiente,
  onVolver,
  onSeleccionarMP,
  onSimular,
  onCancelar,
}: {
  plan: Plan;
  modalStep: 1 | 2;
  datosContacto: DatosContacto;
  redirigiendo: boolean;
  onCambio: (key: keyof DatosContacto, value: string) => void;
  onSiguiente: () => void;
  onVolver: () => void;
  onSeleccionarMP: () => void;
  onSimular: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fact-overlay">
      <div className="fact-modal">

        {/* Indicador de paso */}
        <div className="fact-step-track">
          <div className={`fact-step-item ${modalStep === 1 ? 'active' : 'done'}`}>
            <span className="fact-step-dot" />
            <span className="fact-step-label">Contacto</span>
          </div>
          <span className="fact-step-connector" />
          <div className={`fact-step-item ${modalStep === 2 ? 'active' : ''}`}>
            <span className="fact-step-dot" />
            <span className="fact-step-label">Pago</span>
          </div>
        </div>

        {modalStep === 1 ? (
          <DatosContactoStep
            datos={datosContacto}
            onCambio={onCambio}
            onSiguiente={onSiguiente}
            onCancelar={onCancelar}
          />
        ) : (
          <ElegirPagoStep
            plan={plan}
            redirigiendo={redirigiendo}
            onSeleccionarMP={onSeleccionarMP}
            onSimular={onSimular}
            onVolver={onVolver}
          />
        )}

      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function FacturacionPanel() {
  const {
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
  } = useFacturacionPanel();

  const planActual: PlanId = suscripcion?.plan_id ?? 'startup';

  if (loading) {
    return (
      <div className="fact-wrapper">
        <style jsx global>{facturacionStyles}</style>
        <p className="fact-loading">Cargando datos de facturación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fact-wrapper">
        <style jsx global>{facturacionStyles}</style>
        <p className="fact-load-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="fact-wrapper">
      <style jsx global>{facturacionStyles}</style>

      <h2 className="fact-title">Planes de Suscripción</h2>

      {successMsg  && <p className="fact-success">{successMsg}</p>}
      {actionError && <p className="fact-action-error">{actionError}</p>}

      {/* ── Tarjetas de planes ── */}
      <div className="fact-plans">
        {planes.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            planActual={planActual}
            onSolicitarCambio={abrirModal}
            actionLoading={redirigiendo}
          />
        ))}
      </div>

      {/* ── Nota de pagos ── */}
      <p className="fact-stripe-note">
        <span className="fact-stripe-dot" />
        Pagos procesados de forma segura mediante Mercado Pago. El cambio de plan es inmediato al confirmar el pago.
      </p>

      {/* ── Historial de facturas ── */}
      <div className="fact-invoices">
        <h3 className="fact-invoices-title">Historial de Facturas</h3>

        {facturas.length === 0 ? (
          <p className="fact-empty">Sin facturas registradas.</p>
        ) : (
          facturas.map((f) => (
            <div key={f.id} className="fact-invoice-row">
              <span className="fact-invoice-period">
                {formatPeriodo(f.periodo_inicio)}
              </span>
              <div className="fact-invoice-right">
                <span className="fact-invoice-amount">
                  US${Number(f.monto).toFixed(2)}
                </span>
                <span className={chipClass(f.estado)}>
                  {chipLabel(f.estado)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal de dos pasos ── */}
      {confirmPlan && (
        <PasoModal
          plan={confirmPlan}
          modalStep={modalStep}
          datosContacto={datosContacto}
          redirigiendo={redirigiendo}
          onCambio={actualizarDato}
          onSiguiente={avanzarPago}
          onVolver={volverDatos}
          onSeleccionarMP={handleConfirmarCambio}
          onSimular={handleSimularPago}
          onCancelar={cerrarModal}
        />
      )}
    </div>
  );
}
