/**
 * Servicio para comunicarse con la API de documentos
 * Actualizado a @supabase/supabase-js
 * Maneja: upload, download, listar, borrar
 */

import { SupabaseClient } from '@supabase/supabase-js';

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
  private supabase: SupabaseClient;

  constructor(apiUrl: string, supabase: SupabaseClient) {
    this.apiUrl = apiUrl;
    this.supabase = supabase;
  }

  /**
   * Obtener el token de autenticación actual
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  }

  /**
   * Subir un documento nuevo
   */
  async uploadDocument(file: File, userId: string): Promise<UploadResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch(`${this.apiUrl}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        return { success: false, error: json.error || 'Error al subir archivo' };
      }

      return { success: true, data: json.data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Listar documentos del usuario actual
   */
  async listDocuments(userId: string): Promise<DocumentListResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { documents: [], error: 'No autenticado' };
      }

      const response = await fetch(`${this.apiUrl}/documents?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await response.json();

      if (!response.ok) {
        return { documents: [], error: json.error || 'Error al obtener documentos' };
      }

      return { documents: json.data || [] };
    } catch (error) {
      return { documents: [], error: (error as Error).message };
    }
  }

  /**
   * Descargar un documento (descifrado)
   */
  async downloadDocument(documentId: string): Promise<Blob | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.error('No autenticado');
        return null;
      }

      const response = await fetch(
        `${this.apiUrl}/documents?id=${documentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const json = await response.json();
        console.error('Error descargando:', json.error);
        return null;
      }

      return await response.blob();
    } catch (error) {
      console.error('Error en download:', error);
      return null;
    }
  }

  /**
   * Eliminar un documento
   */
  async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const response = await fetch(
        `${this.apiUrl}/documents?id=${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const json = await response.json();

      if (!response.ok) {
        return { success: false, error: json.error || 'Error al eliminar documento' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Obtener URL de descarga directa (si aplica)
   */
  async getDownloadUrl(documentId: string): Promise<string | null> {
    // Esta función es opcional - depende de cómo quieras servir los archivos
    // Por ahora, retorna null - usa downloadDocument() en su lugar
    return null;
  }
}

export default DocumentService;