/**
 * Servicio para comunicarse con la API de documentos
 * Maneja clave de cifrado por archivo
 */

export interface DocumentMetadata {
  id: string;
  user_id: string;
  nombre_original: string;
  ruta_storage: string;
  tamano_bytes: number;
  tipo_mime: string;
  creado_en: string;
  actualizado_en: string;
}

export interface UploadResponse {
  success: boolean;
  data?: DocumentMetadata;
  error?: string;
}

export interface DocumentListResponse {
  documents: DocumentMetadata[];
  error?: string;
}

class DocumentService {
  private apiUrl: string;
  private getToken: () => string;

  constructor(apiUrl: string, getToken: () => string) {
    this.apiUrl   = apiUrl;
    this.getToken = getToken;
  }

  /** Subir archivo con clave de cifrado del usuario */
  async uploadDocument(file: File, userId: string, userKey: string): Promise<UploadResponse> {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'No autenticado' };

      const formData = new FormData();
      formData.append('file',     file);
      formData.append('userId',   userId);
      formData.append('userKey',  userKey);  // ← clave del usuario

      const response = await fetch(`${this.apiUrl}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      const json = await response.json();
      if (!response.ok) return { success: false, error: json.error || 'Error al subir archivo' };
      return { success: true, data: json.data };

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /** Listar documentos del usuario */
  async listDocuments(userId: string): Promise<DocumentListResponse> {
    try {
      const token = this.getToken();
      if (!token) return { documents: [], error: 'No autenticado' };

      const response = await fetch(`${this.apiUrl}?userId=${userId}`, {
        method:  'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const json = await response.json();
      if (!response.ok) return { documents: [], error: json.error || 'Error al obtener documentos' };
      return { documents: json.data || [] };

    } catch (error) {
      return { documents: [], error: (error as Error).message };
    }
  }

  /** Descargar archivo — requiere la clave del usuario */
  async downloadDocument(documentId: string, userKey: string): Promise<Blob | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${this.apiUrl}?id=${documentId}`, {
        method:  'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-key':  userKey,  // ← clave del usuario para descifrar
        },
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        console.error('Error descargando:', json.error);
        return null;
      }
      return await response.blob();

    } catch {
      return null;
    }
  }

  /** Eliminar documento */
  async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'No autenticado' };

      const response = await fetch(`${this.apiUrl}?id=${documentId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const json = await response.json();
      if (!response.ok) return { success: false, error: json.error || 'Error al eliminar documento' };
      return { success: true };

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default DocumentService;