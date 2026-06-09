'use client';

import React, { useRef, useState } from 'react';
import { useRRHHPanel, FiltroTipo } from './useRRHHPanel';
import { rrhhStyles } from './RRHHPanel.styles';
import { panelStyles } from '../EnterprisePanel/EnterprisePanel.styles';
import {
  RRHHDocumento,
  TipoDocumento,
  TIPO_LABELS,
  TIPO_EMOJI,
  formatBytes,
  formatPeriodo,
} from '@/services/rrhhService';

// ── Iconos SVG ────────────────────────────────────────────────────────────────
const IconRRHH = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <polyline points="17 11 19 13 23 9"/>
  </svg>
);

const IconPen = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Tipos del filtro ──────────────────────────────────────────────────────────
const FILTROS: { id: FiltroTipo; label: string }[] = [
  { id: 'all',               label: 'Todos' },
  { id: 'liquidacion_sueldo', label: '💰 Liquidaciones' },
  { id: 'contrato',           label: '📄 Contratos' },
  { id: 'anexo_contrato',     label: '📎 Anexos' },
];

// ── Modal: Subir documento ────────────────────────────────────────────────────
function UploadModal({
  usuarios,
  actionLoading,
  actionError,
  onClose,
  onSubmit,
}: {
  usuarios: { id: string; email: string; full_name: string | null }[];
  actionLoading: boolean;
  actionError: string;
  onClose: () => void;
  onSubmit: (file: File, asignadoA: string, tipo: TipoDocumento, periodo?: string) => void;
}) {
  const [asignadoA, setAsignadoA] = useState('');
  const [tipo, setTipo]           = useState<TipoDocumento>('liquidacion_sueldo');
  const [periodo, setPeriodo]     = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !asignadoA) return;
    onSubmit(file, asignadoA, tipo, tipo === 'liquidacion_sueldo' ? periodo : undefined);
  }

  return (
    <div className="rrhh-overlay">
      <div className="rrhh-modal">
        <h2 className="rrhh-modal-title">Subir documento RRHH</h2>
        <p className="rrhh-modal-sub">Asigna un documento laboral a un empleado del equipo.</p>

        <form onSubmit={handleSubmit}>
          <div className="rrhh-field">
            <label className="rrhh-label">Empleado *</label>
            <select
              className="rrhh-select"
              value={asignadoA}
              onChange={(e) => setAsignadoA(e.target.value)}
              required
            >
              <option value="">Selecciona un empleado...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name ? `${u.full_name} — ${u.email}` : u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="rrhh-field">
            <label className="rrhh-label">Tipo de documento *</label>
            <select
              className="rrhh-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoDocumento)}
            >
              <option value="liquidacion_sueldo">💰 Liquidación de Sueldo</option>
              <option value="contrato">📄 Contrato</option>
              <option value="anexo_contrato">📎 Anexo de Contrato</option>
            </select>
          </div>

          {tipo === 'liquidacion_sueldo' && (
            <div className="rrhh-field">
              <label className="rrhh-label">Período (AAAA-MM)</label>
              <input
                className="rrhh-input"
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="2024-01"
              />
            </div>
          )}

          <div className="rrhh-field">
            <label className="rrhh-label">Archivo *</label>
            <div
              className={`rrhh-file-drop ${file ? 'has-file' : ''}`}
              onClick={() => inputRef.current?.click()}
            >
              {file ? (
                <p>✓ {file.name} ({formatBytes(file.size)})</p>
              ) : (
                <p>Haz clic para seleccionar un archivo (PDF, DOCX, etc.)</p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {actionError && <p className="rrhh-action-error">{actionError}</p>}

          <div className="rrhh-modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-modal-confirm"
              disabled={actionLoading || !file || !asignadoA}
            >
              {actionLoading ? 'Subiendo...' : 'Subir y asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Confirmar firma ────────────────────────────────────────────────────
function SignModal({
  doc,
  actionLoading,
  actionError,
  onClose,
  onConfirm,
}: {
  doc: RRHHDocumento;
  actionLoading: boolean;
  actionError: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rrhh-overlay">
      <div className="rrhh-modal">
        <h2 className="rrhh-modal-title">Firmar documento</h2>
        <p className="rrhh-modal-sub">Estás a punto de registrar tu firma digital en este documento.</p>

        <div className="rrhh-sign-box">
          <p>
            <strong>Documento:</strong> {doc.nombre_original}<br />
            <strong>Tipo:</strong> {TIPO_LABELS[doc.tipo]}<br />
            {doc.periodo && <><strong>Período:</strong> {formatPeriodo(doc.periodo)}<br /></>}
            <strong>Asignado a:</strong> {doc.asignado_a_email}
          </p>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--wf-muted)', margin: '0 0 4px' }}>
          Al confirmar, se registrará tu firma con fecha y hora actuales. Esta acción no se puede deshacer.
        </p>

        {actionError && <p className="rrhh-action-error">{actionError}</p>}

        <div className="rrhh-modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-modal-confirm" onClick={onConfirm} disabled={actionLoading}>
            {actionLoading ? 'Firmando...' : '✍ Confirmar firma'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Confirmar eliminación ──────────────────────────────────────────────
function DeleteModal({
  doc,
  actionLoading,
  actionError,
  onClose,
  onConfirm,
}: {
  doc: RRHHDocumento;
  actionLoading: boolean;
  actionError: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rrhh-overlay">
      <div className="rrhh-modal">
        <h2 className="rrhh-modal-title">Eliminar documento</h2>
        <p className="rrhh-modal-sub">Esta acción es permanente y no se puede deshacer.</p>

        <div className="rrhh-danger-box">
          Se eliminará permanentemente <strong>{doc.nombre_original}</strong> asignado a {doc.asignado_a_email}.
        </div>

        {actionError && <p className="rrhh-action-error">{actionError}</p>}

        <div className="rrhh-modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-modal-danger" onClick={onConfirm} disabled={actionLoading}>
            {actionLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function RRHHPanel() {
  const {
    documentos, usuarios,
    isAdmin, empleadosConDocs,
    loading, error,
    filtro, setFiltro,
    filtroEmpleado, setFiltroEmpleado,
    uploadOpen, setUploadOpen,
    signTarget, setSignTarget,
    deleteTarget, setDeleteTarget,
    successMsg,
    actionLoading, actionError, setActionError,
    stats,
    handleUpload, handleSign, handleDelete, handleDownload,
  } = useRRHHPanel();

  return (
    <div>
      <style jsx global>{rrhhStyles}</style>
      <style jsx global>{panelStyles}</style>

      {/* ── Encabezado ── */}
      <div className="rrhh-head">
        <div className="rrhh-head-left">
          <div className="rrhh-icon"><IconRRHH /></div>
          <div>
            <h1 className="rrhh-title">Módulo RRHH</h1>
            <p className="rrhh-sub">Gestión de documentos laborales — liquidaciones, contratos y anexos</p>
          </div>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setActionError(''); setUploadOpen(true); }}>
            + Subir documento
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">Total documentos</p>
          <p className="stat-value">{loading ? '—' : stats.total}</p>
          <p className="stat-sub">Todos los tipos</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pendientes de firma</p>
          <p className="stat-value" style={{ color: 'oklch(0.55 0.12 70)' }}>
            {loading ? '—' : stats.pendientes}
          </p>
          <p className="stat-sub">Requieren firma del empleado</p>
        </div>
        <div className="stat-card accent">
          <p className="stat-label">Firmados</p>
          <p className="stat-value accent">{loading ? '—' : stats.firmados}</p>
          <p className="stat-sub">Con firma digital registrada</p>
        </div>
      </div>

      {/* ── Mensaje de éxito ── */}
      {successMsg && (
        <div className="rrhh-success">
          <IconCheck /> {successMsg}
        </div>
      )}

      {/* ── Tabla de documentos ── */}
      <div className="card">
        <div className="rrhh-filters">
          {/* Tabs de tipo */}
          <div className="rrhh-tabs">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                className={`rrhh-tab ${filtro === f.id ? 'active' : ''}`}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtro por empleado — solo visible para admin */}
          {isAdmin && empleadosConDocs.length > 0 && (
            <div className="rrhh-emp-filter">
              <label className="rrhh-emp-filter-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Empleado
              </label>
              <select
                className="rrhh-emp-filter-select"
                value={filtroEmpleado}
                onChange={(e) => setFiltroEmpleado(e.target.value)}
              >
                <option value="all">Todos los empleados</option>
                {empleadosConDocs.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre ? `${emp.nombre} — ${emp.email}` : emp.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rrhh-empty">
            <div className="rrhh-empty-icon">⏳</div>
            <p>Cargando documentos...</p>
          </div>
        ) : error ? (
          <div className="rrhh-empty">
            <div className="rrhh-empty-icon">⚠️</div>
            <p style={{ color: 'var(--wf-danger)' }}>{error}</p>
          </div>
        ) : documentos.length === 0 ? (
          <div className="rrhh-empty">
            <div className="rrhh-empty-icon">📂</div>
            <p>No hay documentos en esta categoría</p>
          </div>
        ) : (
          <div className="rrhh-table-wrap">
            <table className="rrhh-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Tipo</th>
                  <th>Empleado</th>
                  <th>Período</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="rrhh-file-cell">
                        <div className="rrhh-file-ico">{TIPO_EMOJI[doc.tipo]}</div>
                        <div>
                          <p className="rrhh-file-name" title={doc.nombre_original}>{doc.nombre_original}</p>
                          <p className="rrhh-file-size">{formatBytes(doc.tamano_bytes)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="chip-tipo">{TIPO_LABELS[doc.tipo]}</span>
                    </td>
                    <td>
                      <div className="rrhh-emp">
                        <div className="rrhh-avatar">
                          {(doc.asignado_a_email[0] ?? 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="rrhh-emp-email" title={doc.asignado_a_email}>{doc.asignado_a_email}</p>
                          {doc.asignado_a_nombre && (
                            <p className="rrhh-emp-name">{doc.asignado_a_nombre}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--wf-muted)', fontFamily: 'var(--wf-mono)', fontSize: '12px' }}>
                      {formatPeriodo(doc.periodo)}
                    </td>
                    <td>
                      {doc.estado === 'firmado'
                        ? <span className="chip-firmado"><IconCheck /> Firmado</span>
                        : <span className="chip-pendiente">● Pendiente</span>
                      }
                    </td>
                    <td style={{ color: 'var(--wf-faint)', fontSize: '11.5px', fontFamily: 'var(--wf-mono)', whiteSpace: 'nowrap' }}>
                      {new Date(doc.creado_en).toLocaleDateString('es-CL')}
                    </td>
                    <td>
                      <div className="rrhh-actions">
                        {doc.estado === 'pendiente' && (
                          <button
                            className="btn-sign"
                            onClick={() => { setActionError(''); setSignTarget(doc); }}
                          >
                            <IconPen /> Firmar
                          </button>
                        )}
                        <button
                          className="btn-dl"
                          onClick={() => handleDownload(doc)}
                          title="Descargar"
                        >
                          <IconDownload />
                        </button>
                        {isAdmin && (
                          <button
                            className="btn-del"
                            onClick={() => { setActionError(''); setDeleteTarget(doc); }}
                            title="Eliminar"
                          >
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Banner E2EE ── */}
      <div className="enc-banner">
        <div className="enc-ic">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div className="enc-txt">
          <b><span className="enc-pulse" /> Firma Digital Registrada en BD</b>
          <p>Las firmas incluyen ID del firmante, correo y timestamp inmutable · Auditoría SHA-256 activa.</p>
        </div>
        <div className="enc-meta">
          <p className="k">Seguridad</p>
          <p className="v">Nivel 3</p>
        </div>
      </div>

      {/* ── Modal Upload ── */}
      {uploadOpen && (
        <UploadModal
          usuarios={usuarios}
          actionLoading={actionLoading}
          actionError={actionError}
          onClose={() => setUploadOpen(false)}
          onSubmit={handleUpload}
        />
      )}

      {/* ── Modal Firma ── */}
      {signTarget && (
        <SignModal
          doc={signTarget}
          actionLoading={actionLoading}
          actionError={actionError}
          onClose={() => setSignTarget(null)}
          onConfirm={handleSign}
        />
      )}

      {/* ── Modal Eliminar ── */}
      {deleteTarget && (
        <DeleteModal
          doc={deleteTarget}
          actionLoading={actionLoading}
          actionError={actionError}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
