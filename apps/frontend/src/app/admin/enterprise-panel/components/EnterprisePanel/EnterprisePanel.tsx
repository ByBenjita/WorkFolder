'use client';

import React from 'react';
import type { AdminSection } from '../../types';
import { panelStyles } from './EnterprisePanel.styles';
import {
  useHomeSection,
  MOCK_LOGS,
  SECURITY_CHECKS,
  INVOICES,
  RRHH_RECEPTORS,
} from './useEnterprisePanel';

import BovedaPanel      from '../../../../components/boveda/BovedaPanel';
import AdminBovedaPanel from '../AdminBovedaPanel/AdminBovedaPanel';
import AdminUsersPanel  from '../AdminUsersPanel';
import RRHHPanel        from '../RRHHPanel/RRHHPanel';

interface Props {
  section: AdminSection;
}

// ── Componentes reutilizables ────────────────────────────────────
const Stat = ({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) => (
  <div className={`stat-card ${accent ? 'accent' : ''}`}>
    <p className="stat-label">{label}</p>
    <p className={`stat-value ${accent ? 'accent' : ''}`}>{value}</p>
    <p className="stat-sub">{sub}</p>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="section-title">{children}</h2>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">{children}</div>
);

// ── Sección HOME ─────────────────────────────────────────────────
function HomeSection() {
  const { logs } = useHomeSection();

  return (
    <div>
      <SectionTitle>Panel de Control Enterprise</SectionTitle>

      <div className="stats-row">
        <Stat label="Capacidad Total"    value="126 GB / 1 TB"        sub="(2000GB x Usuario Corp)" />
        <Stat label="Estado RRHH (Beta)" value="3 Receptores Activos" sub="16 GB Asignados (5GB c/u)" accent />
      </div>

      <Card>
        <div className="live-row">
          <span className="live-dot" />
          <h3 className="card-title">Auditoría en Tiempo Real (Live Log)</h3>
        </div>
        <div className="terminal">
          <div className="log-header">
            <span>Evento</span><span>Usuario</span><span>Acción</span><span>IP</span><span>Fecha</span>
          </div>
          {logs.length === 0 ? (
            <p style={{ color: '#1e1e1e', textAlign: 'center', padding: '16px 0' }}>Cargando logs...</p>
          ) : logs.map((log, i) => (
            <div key={i} className={`log-row ${log.evento === 'Seguridad' ? 'security' : ''}`}>
              <span className={`log-badge ${log.evento === 'Seguridad' ? 'security' : log.evento !== 'Acceso' ? 'other' : ''}`}>
                {log.evento}
              </span>
              <span className="log-user">{log.usuario}</span>
              <span className="log-action">{log.accion}</span>
              <span className="log-ip">{log.ip}</span>
              <span className="log-date">{log.fecha}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-header">
          <div>
            <h3 className="card-title">📋 Gestión de Módulo RRHH</h3>
            <p className="text-muted mt-8">Receptores RRHH Activos: 3 de 3 (Cupo completo)</p>
            <p className="text-dim mt-4">¿Necesitas más receptores? Agrega por US$4 + IVA cada uno.</p>
          </div>
          <button className="btn-primary-large">Agregar Receptor</button>
        </div>
      </Card>

      <div className="status-bar">
        <span className="green-dot">●</span>
        Nivel de Seguridad 3: Cifrado E2EE · Firma Digital · Auditoría Inmutable SHA-256 activa.
      </div>
    </div>
  );
}

// ── Sección USUARIOS ─────────────────────────────────────────────
function UsuariosSection() {
  return <AdminUsersPanel />;
}

// ── Sección BÓVEDA ───────────────────────────────────────────────
function BovedaSection() {
  return (
    <div>
      <BovedaPanel />
      <AdminBovedaPanel />
    </div>
  );
}

// ── Sección SEGURIDAD ────────────────────────────────────────────
function SeguridadSection() {
  return (
    <div>
      <SectionTitle>Seguridad Nivel 3</SectionTitle>
      <div className="stats-row">
        <Stat label="Nivel Activo" value="Nivel 3"   sub="Máxima protección"  accent />
        <Stat label="MFA Usuarios" value="5/5"       sub="100% habilitado" />
        <Stat label="Último Scan"  value="Hoy 09:00" sub="Sin amenazas" />
      </div>
      <Card>
        <h3 className="card-title card-title-mb">Configuración de Seguridad Activa</h3>
        {SECURITY_CHECKS.map((item, i) => (
          <div key={i} className="check-row">
            <span className={item.status ? 'check-ok' : 'check-off'}>{item.status ? '✓' : '○'}</span>
            <span className={item.status ? 'check-label-ok' : 'check-label-off'}>{item.label}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Sección AUDITORÍA ────────────────────────────────────────────
function AuditoriaSection() {
  return (
    <div>
      <SectionTitle>Auditoría Live</SectionTitle>
      <Card>
        <div className="live-row">
          <span className="live-dot" />
          <h3 className="card-title">Registro completo de eventos</h3>
        </div>
        <div className="terminal">
          {[...MOCK_LOGS, ...MOCK_LOGS].map((log, i) => (
            <div key={i} className={`log-row ${log.evento === 'Seguridad' ? 'security' : ''}`}>
              <span className={`log-badge ${log.evento === 'Seguridad' ? 'security' : log.evento !== 'Acceso' ? 'other' : ''}`}>
                {log.evento}
              </span>
              <span className="log-user">{log.usuario}</span>
              <span className="log-action">{log.accion}</span>
              <span className="log-ip">{log.ip}</span>
              <span className="log-date">{log.fecha}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Sección FACTURACIÓN ──────────────────────────────────────────
function FacturacionSection() {
  return (
    <div>
      <SectionTitle>Facturación</SectionTitle>
      <div className="stats-row">
        <Stat label="Plan Actual"      value="Enterprise" sub="Activo hasta Dic 2024" accent />
        <Stat label="Próximo Cobro"    value="US$149"     sub="01 de Diciembre 2024" />
        <Stat label="Usuarios Pagados" value="5"          sub="$29/usuario/mes" />
      </div>
      <Card>
        <h3 className="card-title card-title-mb">Historial de Facturas</h3>
        {INVOICES.map((f, i) => (
          <div key={i} className="item-row">
            <span className="invoice-mes">📄 {f.mes}</span>
            <div className="invoice-right">
              <span className="invoice-monto">{f.monto}</span>
              <span className="chip green">{f.estado}</span>
              <button className="btn-ghost">PDF</button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Sección RRHH ─────────────────────────────────────────────────
function RRHHSection() {
  return <RRHHPanel />;
}

// ── Mapa de secciones (ACTUALIZADO) ──────────────────────────────
const SECTION_MAP: Record<AdminSection, React.ReactNode> = {
  home:        <HomeSection />,
  usuarios:    <UsuariosSection />,
  rrhh:        <RRHHSection />,
  boveda:      <BovedaSection />,          
  seguridad:   <SeguridadSection />,
  auditoria:   <AuditoriaSection />,
  facturacion: <FacturacionSection />,
};

// ── Componente principal ─────────────────────────────────────────
export default function EnterprisePanel({ section }: Props) {
  return (
    <main className="panel-main">
      <style jsx global>{panelStyles}</style>
      {SECTION_MAP[section]}
    </main>
  );
}