import { getAccessToken } from './authApi';

export type TipoDocumento  = 'liquidacion_sueldo' | 'contrato' | 'anexo_contrato';
export type EstadoDocumento = 'pendiente' | 'firmado';

export interface RRHHDocumento {
  id:                string;
  storage_path:      string;
  nombre_original:   string;
  asignado_a:        string;
  asignado_a_email:  string;
  asignado_a_nombre: string | null;
  asignado_por:      string;
  tipo:              TipoDocumento;
  periodo:           string | null;
  estado:            EstadoDocumento;
  firmado_en:        string | null;
  tamano_bytes:      number | null;
  creado_en:         string;
}

const API_BASE = '/api/rrhh';

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getAccessToken()}` };
}

export const rrhhService = {
  async listDocumentos(): Promise<{ data: RRHHDocumento[]; isAdmin: boolean; error?: string }> {
    try {
      const res  = await fetch(API_BASE, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) return { data: [], isAdmin: false, error: json.error };
      return { data: json.data ?? [], isAdmin: json.isAdmin ?? false };
    } catch {
      return { data: [], isAdmin: false, error: 'Error de conexión' };
    }
  },

  async downloadDocumento(id: string, nombreOriginal: string): Promise<void> {
    const res = await fetch(`${API_BASE}?download=${id}`, { headers: authHeaders() });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? 'Error al descargar');
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = nombreOriginal;
    a.click();
    URL.revokeObjectURL(url);
  },

  async uploadDocumento(
    file:             File,
    asignadoA:        string,
    asignadoAEmail:   string,
    asignadoANombre:  string | null,
    tipo:             TipoDocumento,
    periodo?:         string
  ): Promise<{ success: boolean; data?: RRHHDocumento; error?: string }> {
    try {
      const form = new FormData();
      form.append('file',           file);
      form.append('asignadoA',      asignadoA);
      form.append('asignadoAEmail', asignadoAEmail);
      if (asignadoANombre) form.append('asignadoANombre', asignadoANombre);
      form.append('tipo', tipo);
      if (periodo) form.append('periodo', periodo);

      const res  = await fetch(API_BASE, { method: 'POST', headers: authHeaders(), body: form });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error };
      return { success: true, data: json.data };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  },

  async firmarDocumento(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res  = await fetch(API_BASE, {
        method:  'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  },

  async eliminarDocumento(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res  = await fetch(`${API_BASE}?id=${id}`, { method: 'DELETE', headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  },
};

// ── Helpers de presentación ─────────────────────────────────────────────────
export const TIPO_LABELS: Record<TipoDocumento, string> = {
  liquidacion_sueldo: 'Liquidación de Sueldo',
  contrato:           'Contrato',
  anexo_contrato:     'Anexo de Contrato',
};

export const TIPO_EMOJI: Record<TipoDocumento, string> = {
  liquidacion_sueldo: '💰',
  contrato:           '📄',
  anexo_contrato:     '📎',
};

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function formatPeriodo(periodo: string | null): string {
  if (!periodo) return '—';
  const [year, month] = periodo.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const m = parseInt(month, 10);
  return `${meses[m - 1] ?? month} ${year}`;
}
