import { useState, useEffect } from 'react';

// ── Tipos ────────────────────────────────────────────────────────
export interface AuditLog {
  evento: string;
  usuario: string;
  accion: string;
  ip: string;
  fecha: string;
}

export interface CorpUser {
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface VaultFile {
  name: string;
  size: string;
  category: string;
  date: string;
}

export interface SecurityCheck {
  label: string;
  status: boolean;
}

export interface Invoice {
  mes: string;
  monto: string;
  estado: string;
}

export interface RRHHReceptor {
  name: string;
}

// ── Datos ────────────────────────────────────────────────────────
export const MOCK_LOGS: AuditLog[] = [
  { evento: 'Acceso',       usuario: 'Maria Soto (RRHH)', accion: 'Ver Liquidación',         ip: '192.168.1.45', fecha: '13:54:10' },
  { evento: 'Subida',       usuario: 'Admin Corp',        accion: 'Planos V2.dwg',           ip: '200.55.12.5',  fecha: '13:50:05' },
  { evento: 'Seguridad',    usuario: 'User 2',            accion: 'Intento descarga sin MFA', ip: '158.10.4.2',   fecha: '11:45:22' },
  { evento: 'Modificación', usuario: 'Admin Corp',        accion: 'Permisos RRHH',           ip: '200.55.12.5',  fecha: '11:30:00' },
];

export const CORP_USERS: CorpUser[] = [
  { name: 'Admin Corp',   email: 'admin@empresa.cl',  role: 'Administrador', status: 'activo'   },
  { name: 'Maria Soto',   email: 'maria@empresa.cl',  role: 'RRHH',          status: 'activo'   },
  { name: 'User 2',       email: 'user2@empresa.cl',  role: 'Visor',         status: 'activo'   },
  { name: 'User 3',       email: 'user3@empresa.cl',  role: 'Visor',         status: 'inactivo' },
  { name: 'User 4',       email: 'user4@empresa.cl',  role: 'Visor',         status: 'activo'   },
];

export const VAULT_FILES: VaultFile[] = [
  { name: 'Contrato_2024.pdf',    size: '2.3 MB',  category: 'Legal',       date: '2024-11-10' },
  { name: 'Planos_V2.dwg',        size: '18.7 MB', category: 'Ingeniería',  date: '2024-11-09' },
  { name: 'Nómina_Oct.xlsx',      size: '0.8 MB',  category: 'RRHH',        date: '2024-11-08' },
  { name: 'Política_Datos.docx',  size: '0.3 MB',  category: 'Legal',       date: '2024-11-07' },
];

export const SECURITY_CHECKS: SecurityCheck[] = [
  { label: 'Cifrado E2EE en reposo y tránsito',                  status: true  },
  { label: 'Autenticación de Dos Factores (2FA) obligatorio',    status: true  },
  { label: 'Firma Digital inmutable (SHA-256)',                   status: true  },
  { label: 'Auditoría de accesos en tiempo real',                status: true  },
  { label: 'Bloqueo por intentos fallidos (5 máx)',              status: true  },
  { label: 'Sesiones concurrentes limitadas (1 por usuario)',    status: false },
];

export const INVOICES: Invoice[] = [
  { mes: 'Noviembre 2024',  monto: '$149.00', estado: 'Pagado' },
  { mes: 'Octubre 2024',    monto: '$149.00', estado: 'Pagado' },
  { mes: 'Septiembre 2024', monto: '$120.00', estado: 'Pagado' },
  { mes: 'Agosto 2024',     monto: '$120.00', estado: 'Pagado' },
];

export const RRHH_RECEPTORS: RRHHReceptor[] = [
  { name: 'Maria Soto'    },
  { name: 'Carlos Mora'   },
  { name: 'Ana González'  },
];

// ── Hooks por sección ────────────────────────────────────────────

/** Hook para la sección Home: carga asíncrona de logs */
export const useHomeSection = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setLogs(MOCK_LOGS), 400);
    return () => clearTimeout(timer);
  }, []);

  return { logs };
};
