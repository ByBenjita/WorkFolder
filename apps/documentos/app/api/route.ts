import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptBuffer, decryptBuffer } from '@workfolder/utils';

// ┌─────────────────────────────────────────────────────────────┐
// │ Configuración de Supabase                                    │
// └─────────────────────────────────────────────────────────────┘

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const BUCKET_NAME = 'documentos_cifrados';

// ┌─────────────────────────────────────────────────────────────┐
// │ Utilidades                                                    │
// └─────────────────────────────────────────────────────────────┘

/**
 * Sanitizar nombre de archivo para uso seguro en Storage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes y acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Espacios y especiales → _
    .replace(/_+/g, '_') // Múltiples _ → uno solo
    .replace(/^_|_$/g, ''); // Elimina _ al inicio/final
}

/**
 * Extraer y validar el usuario autenticado del token JWT
 */
async function getUserFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);

    // Verificar token con Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Validar que el usuario tenga acceso al documento
 */
async function validateDocumentOwnership(
  documentId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('documentos_metadata')
    .select('user_id')
    .eq('id', documentId)
    .single();

  return data?.user_id === userId;
}

// ┌─────────────────────────────────────────────────────────────┐
// │ POST: Subir documento                                         │
// └─────────────────────────────────────────────────────────────┘

export async function POST(req: NextRequest) {
  try {
    // Validar autenticación
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadUserId = formData.get('userId') as string;

    // Validar que el usuario suba sus propios documentos
    if (uploadUserId !== userId) {
      return NextResponse.json(
        { error: 'No puedes subir documentos para otro usuario' },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      );
    }

    // Convertir a Buffer y cifrar
    const arrayBuffer = await file.arrayBuffer();
    const encryptedBuffer = encryptBuffer(
      Buffer.from(arrayBuffer),
      ENCRYPTION_KEY
    );

    // Sanitizar nombre y crear ruta
    const safeName = sanitizeFilename(file.name);
    const storagePath = `${userId}/${Date.now()}_${safeName}.enc`;

    // 1. Subir al Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, encryptedBuffer, {
        contentType: 'application/octet-stream',
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      throw storageError;
    }

    // 2. Guardar metadata en PostgreSQL
    const { data, error: dbError } = await supabase
      .from('documentos_metadata')
      .insert({
        user_id: userId,
        nombre_original: file.name,
        ruta_storage: storagePath,
        tamano_bytes: file.size,
        tipo_mime: file.type,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (err: any) {
    console.error('POST error:', err);
    return NextResponse.json(
      { error: err.message || 'Error al subir documento' },
      { status: 500 }
    );
  }
}

// ┌─────────────────────────────────────────────────────────────┐
// │ GET: Listar documentos o descargar uno                        │
// └─────────────────────────────────────────────────────────────┘

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Validar autenticación
    const authUserId = await getUserFromRequest(req);
    if (!authUserId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // CASO 1: Descargar un documento específico
    if (documentId) {
      // Validar que el usuario tenga acceso
      const hasAccess = await validateDocumentOwnership(
        documentId,
        authUserId
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes acceso a este documento' },
          { status: 403 }
        );
      }

      // Obtener metadata
      const { data: meta, error: metaError } = await supabase
        .from('documentos_metadata')
        .select('*')
        .eq('id', documentId)
        .single();

      if (metaError) {
        console.error('Meta error:', metaError);
        return NextResponse.json(
          { error: 'Documento no encontrado' },
          { status: 404 }
        );
      }

      // Descargar archivo cifrado
      const { data: fileData, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(meta.ruta_storage);

      if (storageError) {
        console.error('Storage error:', storageError);
        return NextResponse.json(
          { error: 'Error descargando archivo' },
          { status: 500 }
        );
      }

      // Descifrar
      const encryptedBuffer = Buffer.from(await fileData.arrayBuffer());
      const decryptedBuffer = decryptBuffer(encryptedBuffer, ENCRYPTION_KEY);

      // Retornar archivo descifrado
      const uint8Array = new Uint8Array(decryptedBuffer);
      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': meta.tipo_mime,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(meta.nombre_original)}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // CASO 2: Listar documentos del usuario
    if (userId && userId === authUserId) {
      const { data: documents, error: dbError } = await supabase
        .from('documentos_metadata')
        .select('*')
        .eq('user_id', userId)
        .order('creado_en', { ascending: false });

      if (dbError) {
        console.error('DB error:', dbError);
        return NextResponse.json(
          { error: 'Error obteniendo documentos' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: documents || [],
      });
    }

    // Parámetros inválidos
    return NextResponse.json(
      { error: 'Parámetros inválidos' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Error en la solicitud' },
      { status: 500 }
    );
  }
}

// ┌─────────────────────────────────────────────────────────────┐
// │ DELETE: Eliminar documento                                    │
// └─────────────────────────────────────────────────────────────┘

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'ID de documento requerido' },
        { status: 400 }
      );
    }

    // Validar autenticación
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validar propiedad del documento
    const hasAccess = await validateDocumentOwnership(documentId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este documento' },
        { status: 403 }
      );
    }

    // Obtener metadata para saber qué borrar
    const { data: meta, error: metaError } = await supabase
      .from('documentos_metadata')
      .select('ruta_storage')
      .eq('id', documentId)
      .single();

    if (metaError) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar del Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([meta.ruta_storage]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // No fallar si Storage falla, intentar borrar la metadata
    }

    // Eliminar de la base de datos
    const { error: dbError } = await supabase
      .from('documentos_metadata')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('DB delete error:', dbError);
      return NextResponse.json(
        { error: 'Error eliminando documento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado correctamente',
    });
  } catch (err: any) {
    console.error('DELETE error:', err);
    return NextResponse.json(
      { error: err.message || 'Error al eliminar' },
      { status: 500 }
    );
  }
}