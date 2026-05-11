'use client';

import React from 'react';
import type { AdminSection } from '../../types';
import { panelStyles } from './EnterprisePanel.styles';
import {
  useHomeSection,
  MOCK_LOGS,
  CORP_USERS,
  VAULT_FILES,
  SECURITY_CHECKS,
  INVOICES,
  RRHH_RECEPTORS,
} from './useEnterprisePanel';

interface Props { section: AdminSection; }

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
            <p style={{ color: '#4a5568', fontSize: 13, margin: '8px 0 0' }}>Receptores RRHH Activos: 3 de 3 (Cupo completo)</p>
            <p style={{ color: '#2d3748', fontSize: 12, margin: '4px 0 0' }}>¿Necesitas más receptores? Agrega por US$4 + IVA cada uno.</p>
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
  return (
    <div>
      <SectionTitle>Usuarios Corp</SectionTitle>
      <Card>
        <div className="card-header">
          <p style={{ color: '#4a5568', fontSize: 13, margin: 0 }}>5 de 5 usuarios activos (plan completo)</p>
          <button className="btn-primary">+ Nuevo Usuario</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              {['Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {CORP_USERS.map((u, i) => (
              <tr key={i}>
                <td style={{ color: '#fff', fontWeight: 600 }}>{u.name}</td>
                <td style={{ color: '#4a5568' }}>{u.email}</td>
                <td><span className={`chip ${u.role === 'Administrador' ? 'blue' : ''}`}>{u.role}</span></td>
                <td><span className={`chip ${u.status === 'activo' ? 'green' : ''}`}>{u.status}</span></td>
                <td><button className="btn-ghost">Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Sección BÓVEDA ───────────────────────────────────────────────
function BovedaSection() {
  return (
    <div>
      <SectionTitle>Bóveda Enterprise</SectionTitle>
      <div className="stats-row">
        <Stat label="Almacenamiento" value="126 GB" sub="de 1 TB usado" />
        <Stat label="Archivos"       value="1,247"  sub="en 8 categorías" accent />
        <Stat label="Compartidos"    value="34"     sub="activos este mes" />
      </div>
      <Card>
        <div className="card-header">
          <h3 className="card-title">Archivos Recientes</h3>
          <button className="btn-primary">↑ Subir Archivo</button>
        </div>
        {VAULT_FILES.map((f, i) => (
          <div key={i} className="item-row">
            <div className="item-left">
              <div className="file-icon">📄</div>
              <div>
                <p className="file-name">{f.name}</p>
                <p className="file-meta">{f.size} · {f.date}</p>
              </div>
            </div>
            <span className="chip">{f.category}</span>
          </div>
        ))}
      </Card>
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
        <h3 className="card-title" style={{ marginBottom: 16 }}>Configuración de Seguridad Activa</h3>
        {SECURITY_CHECKS.map((item, i) => (
          <div key={i} className="check-row">
            <span style={{ color: item.status ? '#22c55e' : '#374151', fontSize: 16 }}>
              {item.status ? '✓' : '○'}
            </span>
            <span style={{ color: item.status ? '#cbd5e0' : '#374151', fontSize: 13 }}>
              {item.label}
            </span>
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
        <h3 className="card-title" style={{ marginBottom: 16 }}>Historial de Facturas</h3>
        {INVOICES.map((f, i) => (
          <div key={i} className="item-row">
            <span style={{ color: '#cbd5e0', fontSize: 13 }}>📄 {f.mes}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{f.monto}</span>
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
  return (
    <div>
      <SectionTitle>Módulo RRHH (Beta)</SectionTitle>
      <div className="stats-row">
        <Stat label="Receptores Activos" value="3/3"   sub="Cupo completo"      accent />
        <Stat label="GB Asignados"       value="16 GB" sub="5 GB por receptor" />
        <Stat label="Documentos"         value="284"   sub="Nóminas y contratos" />
      </div>
      <Card>
        <div className="card-header">
          <h3 className="card-title">Receptores RRHH</h3>
          <button className="btn-primary">+ Agregar Receptor (US$4)</button>
        </div>
        {RRHH_RECEPTORS.map((r, i) => (
          <div key={i} className="item-row">
            <div className="item-left">
              <div className="avatar">{r.name[0]}</div>
              <div>
                <p className="receptor-name">{r.name}</p>
                <p className="receptor-meta">Receptor RRHH · 5 GB asignados</p>
              </div>
            </div>
            <span className="chip green">Activo</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
const SECTION_MAP: Record<AdminSection, React.ReactNode> = {
  home:        <HomeSection />,
  usuarios:    <UsuariosSection />,
  rrhh:        <RRHHSection />,
  boveda:      <BovedaSection />,
  seguridad:   <SeguridadSection />,
  auditoria:   <AuditoriaSection />,
  facturacion: <FacturacionSection />,
};

export default function EnterprisePanel({ section }: Props) {
  return (
    <main className="panel-main">
      <style jsx>{panelStyles}</style>
      {SECTION_MAP[section]}
    </main>
  );
}
