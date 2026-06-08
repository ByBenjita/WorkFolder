'use client';

import React, { useState, useRef } from 'react';
import { useBoveda } from '@/hooks/useBoveda';
import { authApi } from '@/services/authApi';
import { panelStyles } from "../../admin/enterprise-panel/components/EnterprisePanel/EnterprisePanel.styles";

interface Props {
  section: 'boveda';
}

// ── Iconos de línea ────────────────────────────────────────
const ICONS = {
  vault: (<><rect x="3" y="4" width="18" height="16" rx="3" />
  <path d="M3 9h18" />
  <path d="M9 4v5" />
  <circle cx="12" cy="14.5" r="1.8" /></>),

  shieldLock: (<><path d="M12 3 5 6v6c0 4.2 2.9 7.4 7 8.7 4.1-1.3 7-4.5 7-8.7V6z" />
  <path d="M12 11v3" />
  <path d="M9.5 11.5a2.5 2.5 0 1 1 5 0" /></>),

  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" />
  <path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),

  download: (<><path d="M12 4v11" />
  <path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>),

  key: (<><circle cx="8" cy="15" r="4" />
  <path d="m10.8 12.2 7-7" /><path d="m17 5 2.5 2.5" />
  <path d="m14.5 7.5 2 2" /></>),

  trash: (<><path d="M4 7h16" />
  <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" /></>),

  upload: (<><path d="M12 19V6" /><path d="m6 11 6-6 6 6" />
  <path d="M5 21h14" /></>),
  arrowRight: (<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
  
  trendUp: (<><path d="m6 17 5-5 3 3 5-6" /><path d="M19 9v4h-4" /></>),
};

const Icon = ({ n, w = 16, s = 2 }: { n: keyof typeof ICONS; w?: number; s?: number }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={s} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}>
    {ICONS[n]}
  </svg>
);

const Spark = ({ bars }: { bars: number[] }) => (
  <div className="spark">
    {bars.map((h, i) => (
      <i key={i} className={i === bars.length - 1 ? 'on' : ''} style={{ height: `${h}%` }} />
    ))}
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">{children}</div>
);

const Stat = ({ label, value, unit, sub, accent, chip, children }: {
  label: string; value: string; unit?: string; sub: React.ReactNode;
  accent?: boolean; chip?: React.ReactNode; children?: React.ReactNode;
}) => (
  <div className={`stat-card ${accent ? 'accent' : ''}`}>
    <div className="stat-top">
      <p className="stat-label">{label}</p>
      {chip}
    </div>
    <p className={`stat-value ${accent ? 'accent' : ''}`}>
      {value}{unit && <span className="stat-unit">{unit}</span>}
    </p>
    <p className="stat-sub">{sub}</p>
    {children}
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

// ── Toast de exito ───────────────────────────────────────────────
const SUCCESS_TOAST_STYLES = `
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(32px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateY(0)    scale(1);    }
    to   { opacity: 0; transform: translateY(16px) scale(0.95); }
  }
  .wf-toast-enter { animation: toast-in  0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  .wf-toast-exit  { animation: toast-out 0.3s  ease-in                             forwards; }
`;

interface SuccessToastProps {
  message: string;
  visible: boolean;
}

function SuccessToast({ message, visible }: SuccessToastProps) {
  return (
    <>
      <style>{SUCCESS_TOAST_STYLES}</style>
      <div
        className={visible ? 'wf-toast-enter' : 'wf-toast-exit'}
        style={{
          position:        'fixed',
          bottom:          32,
          left:            '50%',
          transform:       'translateX(-50%)',
          zIndex:          2000,
          display:         'flex',
          alignItems:      'center',
          gap:             12,
          backgroundColor: '#052e16',
          border:          '1px solid #166534',
          borderRadius:    12,
          padding:         '14px 22px',
          boxShadow:       '0 8px 32px rgba(0,0,0,0.35)',
          minWidth:        260,
          pointerEvents:   'none',
        }}
      >
        <div style={{
          width:           28,
          height:          28,
          borderRadius:    '50%',
          backgroundColor: '#16a34a',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{
          color:      '#dcfce7',
          fontSize:   14,
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}>
          {message}
        </span>
      </div>
    </>
  );
}

// ── Modal de cambio de clave con 2FA ─────────────────────────────
interface RekeyModalProps {
  isOpen:     boolean;
  fileName:   string;
  onConfirm:  (newKey: string, mfaCode: string) => void;
  onCancel:   () => void;
  loading:    boolean;
  error:      string;
}

function RekeyModal({ isOpen, fileName, onConfirm, onCancel, loading, error }: RekeyModalProps) {
  const [step,    setStep]    = useState<1 | 2>(1);
  const [newKey,  setNewKey]  = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState('');

  const reset = () => {
    setStep(1);
    setNewKey('');
    setMfaCode('');
    setShowKey(false);
    setKeyError('');
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleNextStep = () => {
    if (newKey.length < 8) {
      setKeyError('La clave debe tener al menos 8 caracteres');
      return;
    }
    setKeyError('');
    setStep(2);
  };

  const handleConfirm = () => {
    if (mfaCode.length !== 6) return;
    onConfirm(newKey, mfaCode);
  };

  const handleClose = () => {
    if (!loading) handleCancel();
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
        backgroundColor: '#ffffff', borderRadius: 16, padding: 32,
        width: '100%', maxWidth: 420,
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, margin: '0 auto 16px',
        }}>
          {step === 1 ? '#' : '@'}
        </div>

        <h3 style={{ color: '#111827', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
          {step === 1 ? 'Nueva clave de cifrado' : 'Verificación 2FA'}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            width: 24, height: 4, borderRadius: 2,
            backgroundColor: '#3b82f6',
          }} />
          <span style={{
            width: 24, height: 4, borderRadius: 2,
            backgroundColor: step === 2 ? '#3b82f6' : '#e5e7eb',
          }} />
        </div>

        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
          {step === 1
            ? `Define la nueva clave para "${fileName}".`
            : 'Ingresa el código de tu aplicación de autenticación para autorizar el cambio.'}
        </p>

        {step === 1 && (
          <>
            <label style={{
              display: 'block', color: '#374151', fontSize: 12,
              fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Nueva clave
            </label>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Minimo 8 caracteres"
                value={newKey}
                onChange={(e) => { setNewKey(e.target.value); setKeyError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
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
                onClick={() => setShowKey(!showKey)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', color: '#9ca3af', fontSize: 14,
                }}
              >
                {showKey ? 'ocultar' : 'ver'}
              </button>
            </div>
            {keyError && (
              <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>{keyError}</p>
            )}
            <div style={{
              backgroundColor: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 8, padding: '10px 12px', marginBottom: 20,
              fontSize: 12, color: '#92400e', lineHeight: 1.5,
            }}>
              Todos los archivos que uses con esta clave deberan usar la nueva clave a partir de ahora.
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <label style={{
              display: 'block', color: '#374151', fontSize: 12,
              fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Codigo 2FA
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && mfaCode.length === 6 && handleConfirm()}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #d1d5db', borderRadius: 8,
                padding: '12px', fontSize: 22, fontWeight: 700,
                letterSpacing: 8, textAlign: 'center',
                outline: 'none', color: '#111827', backgroundColor: '#f9fafb',
                marginBottom: 8,
              }}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{error}</p>
            )}
            <div style={{
              backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, padding: '10px 12px', marginBottom: 20,
              fontSize: 12, color: '#1e40af', lineHeight: 1.5,
            }}>
              Abre tu aplicacion de autenticacion y copia el codigo de 6 digitos.
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={step === 2 ? () => setStep(1) : handleClose}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: 8,
              border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
              color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            {step === 2 ? 'Atras' : 'Cancelar'}
          </button>
          <button
            onClick={step === 1 ? handleNextStep : handleConfirm}
            disabled={loading || (step === 1 ? newKey.length < 8 : mfaCode.length !== 6)}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              backgroundColor: (
                step === 1
                  ? (newKey.length >= 8 ? '#3b82f6' : '#e5e7eb')
                  : (mfaCode.length === 6 && !loading ? '#3b82f6' : '#e5e7eb')
              ),
              color: (
                step === 1
                  ? (newKey.length >= 8 ? '#ffffff' : '#9ca3af')
                  : (mfaCode.length === 6 && !loading ? '#ffffff' : '#9ca3af')
              ),
              fontWeight: 700, fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Procesando...' : (step === 1 ? 'Siguiente' : 'Confirmar cambio')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sección Bóveda ────────────────────────────────────────────────
function BovedaSection() {
  const { documents, loading, error, uploadFile, deleteFile, downloadFile, rekeyFile, uploading } = useBoveda();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [uploadError,  setUploadError]  = useState<string | null>(null);

  // ── Estado de modales ─────────────────────────────────────────
  const [pendingFile,      setPendingFile]      = useState<File | null>(null);
  const [downloadTarget,   setDownloadTarget]   = useState<{ id: string; name: string } | null>(null);
  const [uploadModalOpen,  setUploadModalOpen]  = useState(false);
  const [downloadModalOpen,setDownloadModalOpen]= useState(false);

  // ── Estado de cambio de clave ─────────────────────────────────
  const [rekeyTarget,  setRekeyTarget]  = useState<{ id: string; name: string } | null>(null);
  const [rekeyLoading, setRekeyLoading] = useState(false);
  const [rekeyError,   setRekeyError]   = useState('');
  const [rekeySuccess, setRekeySuccess] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────
  const totalSize   = documents.reduce((acc, doc) => acc + doc.tamano_bytes, 0);
  const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
  const pctUsado    = (totalSize / (1024 ** 4)) * 100;
  const recientes   = documents.filter(d => {
    const ago = new Date(); ago.setDate(ago.getDate() - 30);
    return new Date(d.creado_en) > ago;
  }).length;

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
    if (!confirm('Estas seguro de que quieres eliminar este documento?')) return;
    setDeletingId(documentId);
    const success = await deleteFile(documentId);
    if (!success) setUploadError(error || 'Error al eliminar el documento');
    setDeletingId(null);
  };

  // ── Flujo cambio de clave ─────────────────────────────────────
  const handleRekeyClick = (documentId: string, fileName: string) => {
    setRekeyError('');
    setRekeyTarget({ id: documentId, name: fileName });
  };

  const handleRekeyConfirm = async (newKey: string, mfaCode: string) => {
    if (!rekeyTarget) return;
    setRekeyLoading(true);
    setRekeyError('');

    try {
      const factorData = await authApi.getVerifiedFactor();
      if (!factorData.success || !factorData.factor_id) {
        setRekeyError('No tienes 2FA configurado. Configura la autenticacion de dos factores primero.');
        setRekeyLoading(false);
        return;
      }

      const result = await rekeyFile(rekeyTarget.id, newKey, mfaCode, factorData.factor_id);
      if (result.success) {
        setRekeyTarget(null);
        setRekeyError('');
        setToastExiting(false);
        setRekeySuccess(true);
        setTimeout(() => setToastExiting(true),  3000);
        setTimeout(() => setRekeySuccess(false),  3350);
      } else {
        setRekeyError(result.error || 'Error al cambiar la clave');
      }
    } catch {
      setRekeyError('Error de conexion al cambiar la clave');
    } finally {
      setRekeyLoading(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-icon"><Icon n="vault" w={24} s={1.9} /></div>
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Bóveda Enterprise</h2>
          <p className="page-sub">Documentos cifrados de extremo a extremo · almacenamiento de nivel corporativo</p>
        </div>
      </div>

      {/* Modales */}
      <KeyModal
        isOpen={uploadModalOpen}
        title="Establecer clave de cifrado"
        description={`Define una clave unica para cifrar "${pendingFile?.name}". Necesitaras esta clave para descargarlo despues.`}
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

      <RekeyModal
        isOpen={rekeyTarget !== null}
        fileName={rekeyTarget?.name || ''}
        onConfirm={handleRekeyConfirm}
        onCancel={() => { setRekeyTarget(null); setRekeyError(''); }}
        loading={rekeyLoading}
        error={rekeyError}
      />

      {rekeySuccess && (
        <SuccessToast
          message="Cambio de clave realizado con exito"
          visible={!toastExiting}
        />
      )}

      {/* Stats */}
      <div className="stats-row">
        <Stat
          label="Almacenamiento"
          value={totalSizeGB}
          unit="GB"
          sub={<>de <b>1 TB</b> disponibles</>}
          chip={<span className="stat-chip neutral">{pctUsado.toFixed(2)}% usado</span>}
        >
          <div className="stat-bar"><i style={{ width: `${Math.min(Math.max(pctUsado, 0.4), 100)}%` }} /></div>
          <div className="stat-scale"><span>0 GB</span><span>1 TB</span></div>
        </Stat>

        <Stat
          label="Archivos"
          value={documents.length.toString()}
          sub="documentos guardados y cifrados"
          accent
          chip={<span className="stat-chip green"><Icon n="arrowRight" w={12} s={2.4} />Activo</span>}
        >
          <Spark bars={[30, 20, 45, 35, 60, 100]} />
        </Stat>

        <Stat
          label="Últimos 30 días"
          value={recientes.toString()}
          sub="documentos nuevos este periodo"
          chip={<span className="stat-chip green"><Icon n="trendUp" w={12} s={2.4} />+{recientes}</span>}
        >
          <Spark bars={[0, 0, 0, 0, 0, 100]} />
        </Stat>
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
                <div className="file-icon-wrap">
                  <div className="file-icon">{getFileIcon(doc.tipo_mime)}</div>
                  <span className="lock-badge"><Icon n="lock" w={9} s={2.6} /></span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="file-name-row">
                    <p className="file-name" title={doc.nombre_original}
                      style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.nombre_original}
                    </p>
                    <span className="tag-cifrado"><Icon n="lock" w={10} s={2.4} />Cifrado</span>
                  </div>
                  <p className="file-meta">{formatFileSize(doc.tamano_bytes)} · {formatDate(doc.creado_en)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn-ghost"
                  onClick={() => handleDownloadClick(doc.id, doc.nombre_original)}
                >
                  <Icon n="download" w={14} />Descargar
                </button>
                <button className="btn-ghost btn-key"
                  onClick={() => handleRekeyClick(doc.id, doc.nombre_original)}
                >
                  <Icon n="key" w={14} />Cambiar clave
                </button>
                <button className="btn-ghost btn-danger"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  style={{ opacity: deletingId === doc.id ? 0.6 : 1 }}
                >
                  <Icon n="trash" w={14} />{deletingId === doc.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      <div className="enc-banner">
        <div className="enc-ic"><Icon n="shieldLock" w={22} s={1.9} /></div>
        <div className="enc-txt">
          <b><span className="enc-pulse" />Encriptación E2EE activa</b>
          <p>Todos los documentos están cifrados de extremo a extremo. Solo tú posees las claves de descifrado.</p>
        </div>
        <div className="enc-meta">
          <div className="k">Algoritmo</div>
          <div className="v">AES-256-GCM</div>
        </div>
      </div>

      <style jsx global>{panelStyles}</style>
    </div>
  );
}

export default function BovedaPanel() {
  return <BovedaSection />;
} 