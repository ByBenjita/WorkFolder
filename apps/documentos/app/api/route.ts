


import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptBuffer, decryptBuffer } from '@workfolder/utils';
import * as crypto from 'crypto';

// ── Configuración ────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MASTER_KEY  = process.env.ENCRYPTION_KEY!;
const BUCKET_NAME = 'documentos_cifrados';

// ── Helpers ──────────────────────────────────────────────────────

function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function getUserFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id || null;
  } catch {
    return null;
  }
}

async function validateDocumentOwnership(documentId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('documentos_metadata')
    .select('user_id')
    .eq('id', documentId)
    .single();
  return data?.user_id === userId;
}

/**
 * Cifra la clave del usuario con la MASTER_KEY del servidor
 * Así la clave nunca se guarda en texto plano
 */
function encryptUserKey(userKey: string): string {
  const iv         = crypto.randomBytes(16);
  const keyBuffer  = Buffer.from(MASTER_KEY.padEnd(32).slice(0, 32));
  const cipher     = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  const encrypted  = Buffer.concat([cipher.update(userKey, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Descifra la clave del usuario usando la MASTER_KEY
 */
function decryptUserKey(encryptedKey: string): string {
  const [ivHex, encHex] = encryptedKey.split(':');
  const iv        = Buffer.from(ivHex, 'hex');
  const keyBuffer = Buffer.from(MASTER_KEY.padEnd(32).slice(0, 32));
  const decipher  = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
// Crea un cliente de Supabase con el token del usuario para operaciones que requieren autenticación
function createUserSupabaseClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { autoRefreshToken: false, persistSession: false },
  });
}
// Verifica si el usuario es admin para permitir acceso a funciones avanzadas
async function checkUserIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.app_metadata?.role === 'admin';
}

// ── POST: Subir documento ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const formData    = await req.formData();
    const file        = formData.get('file') as File;
    const uploadUserId = formData.get('userId') as string;
    const userKey     = formData.get('userKey') as string;  // ← clave del usuario

    if (uploadUserId !== userId) {
      return NextResponse.json({ error: 'No puedes subir documentos para otro usuario' }, { status: 403 });
    }
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    if (!userKey || userKey.length < 8) {
      return NextResponse.json({ error: 'La clave debe tener al menos 8 caracteres' }, { status: 400 });
    }

    // Cifrar archivo con la clave del usuario
    const arrayBuffer    = await file.arrayBuffer();
    const encryptedBuffer = encryptBuffer(Buffer.from(arrayBuffer), userKey);

    // Cifrar la clave del usuario con la MASTER_KEY para guardarla segura
    const encryptedUserKey = encryptUserKey(userKey);

    const safeName    = sanitizeFilename(file.name);
    const storagePath = `${userId}/${Date.now()}_${safeName}.enc`;

    // Subir al Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, encryptedBuffer, { contentType: 'application/octet-stream' });

    if (storageError) throw storageError;

    // Guardar metadata + clave cifrada en BD
    const { data, error: dbError } = await supabase
      .from('documentos_metadata')
      .insert({
        user_id:         userId,
        nombre_original: file.name,
        ruta_storage:    storagePath,
        tamano_bytes:    file.size,
        tipo_mime:       file.type,
        clave_cifrada:   encryptedUserKey,  // ← clave cifrada con MASTER_KEY
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error('POST error:', err);
    return NextResponse.json({ error: err.message || 'Error al subir documento' }, { status: 500 });
  }
}

// ── GET: Listar o descargar ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');
    const userId     = searchParams.get('userId');

    const authUserId = await getUserFromRequest(req);
    if (!authUserId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // CASO 1: Descargar archivo
    if (documentId) {
      const userKey = req.headers.get('x-user-key');  // ← clave enviada por el usuario
      if (!userKey) {
        return NextResponse.json({ error: 'Clave de descifrado requerida' }, { status: 400 });
      }

      const hasAccess = await validateDocumentOwnership(documentId, authUserId);
      if (!hasAccess) return NextResponse.json({ error: 'No tienes acceso' }, { status: 403 });

      // Obtener metadata con clave cifrada
      const { data: meta, error: metaError } = await supabase
        .from('documentos_metadata')
        .select('*')
        .eq('id', documentId)
        .single();

      if (metaError) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

      // Verificar que la clave del usuario es correcta
      let storedKey: string;
      try {
        storedKey = decryptUserKey(meta.clave_cifrada);
      } catch {
        return NextResponse.json({ error: 'Error al verificar la clave' }, { status: 500 });
      }

      if (storedKey !== userKey) {
        return NextResponse.json({ error: 'Clave incorrecta' }, { status: 403 });
      }

      // Descargar archivo cifrado
      const { data: fileData, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(meta.ruta_storage);

      if (storageError) return NextResponse.json({ error: 'Error descargando archivo' }, { status: 500 });

      // Descifrar con la clave del usuario
      const encryptedBuffer = Buffer.from(await fileData.arrayBuffer());
      const decryptedBuffer = decryptBuffer(encryptedBuffer, userKey);
      const uint8Array      = new Uint8Array(decryptedBuffer);

      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type':        meta.tipo_mime,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(meta.nombre_original)}"`,
          'Cache-Control':       'no-store, no-cache, must-revalidate',
        },
      });
    }

    // CASO 2: Listar documentos del usuario
    if (userId && userId === authUserId) {
      const { data: documents, error: dbError } = await supabase
        .from('documentos_metadata')
        .select('id, user_id, nombre_original, ruta_storage, tamano_bytes, tipo_mime, creado_en, actualizado_en')
        .eq('user_id', userId)
        .order('creado_en', { ascending: false });

      if (dbError) return NextResponse.json({ error: 'Error obteniendo documentos' }, { status: 500 });

      return NextResponse.json({ data: documents || [] });
    }

    // CASO 3: Admin - listar todos los documentos
    if (searchParams.get('adminAll') === 'true') {
      const isAdmin = await checkUserIsAdmin(authUserId);
      if (!isAdmin) return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });

      const { data: documents, error: dbError } = await supabase
        .from('documentos_metadata')
        .select('id, user_id, nombre_original, ruta_storage, tamano_bytes, tipo_mime, creado_en, actualizado_en')
        .order('creado_en', { ascending: false });

      if (dbError) return NextResponse.json({ error: 'Error obteniendo documentos' }, { status: 500 });

      const uniqueUserIds = [...new Set((documents || []).map((d: { user_id: string }) => d.user_id))];
      const userEmailMap: Record<string, string> = {};

      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          const { data } = await supabase.auth.admin.getUserById(uid as string);
          if (data?.user?.email) userEmailMap[uid as string] = data.user.email;
        })
      );

      const enriched = (documents || []).map((d: { user_id: string }) => ({
        ...d,
        user_email: userEmailMap[d.user_id] || d.user_id,
      }));

      return NextResponse.json({ data: enriched });
    }

    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });

  } catch (err: any) {
    console.error('GET error:', err);
    return NextResponse.json({ error: err.message || 'Error en la solicitud' }, { status: 500 });
  }
}

// ── PATCH: Re-cifrar documento con nueva clave ───────────────────
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const userId = await getUserFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { documentId, newKey, mfaCode, factorId, adminOverride } = await req.json();

    if (!documentId || !newKey || newKey.length < 8) {
      return NextResponse.json(
        { error: 'documentId y newKey (mínimo 8 caracteres) son requeridos' },
        { status: 400 }
      );
    }

    if (adminOverride) {
      const isAdmin = await checkUserIsAdmin(userId);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
      }
    } else {
      const hasAccess = await validateDocumentOwnership(documentId, userId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'No tienes acceso a este documento' }, { status: 403 });
      }

      if (!mfaCode || !factorId) {
        return NextResponse.json(
          { error: 'Se requiere verificación 2FA para cambiar la clave', code: 'REQUIRES_2FA' },
          { status: 403 }
        );
      }

      const userClient = createUserSupabaseClient(token);
      const { error: mfaError } = await userClient.auth.mfa.challengeAndVerify({
        factorId,
        code: mfaCode,
      });
      if (mfaError) {
        return NextResponse.json({ error: 'Código 2FA incorrecto o expirado' }, { status: 401 });
      }
    }

    const { data: meta, error: metaError } = await supabase
      .from('documentos_metadata')
      .select('*')
      .eq('id', documentId)
      .single();

    if (metaError || !meta) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (!meta.clave_cifrada) {
      return NextResponse.json(
        { error: 'Este documento no tiene clave de cifrado registrada.' },
        { status: 422 }
      );
    }

    let currentKey: string;
    try {
      currentKey = decryptUserKey(meta.clave_cifrada);
    } catch (decryptErr: any) {
      console.error('decryptUserKey error:', decryptErr.message, '| formato clave_cifrada:', typeof meta.clave_cifrada, meta.clave_cifrada?.slice(0, 20));
      return NextResponse.json(
        { error: 'Error al descifrar la clave del documento: ' + decryptErr.message },
        { status: 500 }
      );
    }

    const { data: fileData, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(meta.ruta_storage);

    if (storageError || !fileData) {
      return NextResponse.json({ error: 'Error descargando el archivo' }, { status: 500 });
    }

    const encryptedBuffer    = Buffer.from(await fileData.arrayBuffer());
    const decryptedBuffer    = decryptBuffer(encryptedBuffer, currentKey);
    const newEncryptedBuffer = encryptBuffer(decryptedBuffer, newKey);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(meta.ruta_storage, newEncryptedBuffer, {
        contentType: 'application/octet-stream',
        upsert:      true,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Error actualizando el archivo cifrado' }, { status: 500 });
    }

    const newEncryptedKey = encryptUserKey(newKey);
    const { error: dbError } = await supabase
      .from('documentos_metadata')
      .update({ clave_cifrada: newEncryptedKey })
      .eq('id', documentId);

    if (dbError) {
      return NextResponse.json({ error: 'Error actualizando la clave en base de datos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Clave actualizada correctamente' });

  } catch (err: any) {
    console.error('PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Error al cambiar la clave' }, { status: 500 });
  }
}

// ── DELETE: Eliminar documento ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const userId = await getUserFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const hasAccess = await validateDocumentOwnership(documentId, userId);
    if (!hasAccess) return NextResponse.json({ error: 'No tienes acceso' }, { status: 403 });

    const { data: meta, error: metaError } = await supabase
      .from('documentos_metadata')
      .select('ruta_storage')
      .eq('id', documentId)
      .single();

    if (metaError) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

    await supabase.storage.from(BUCKET_NAME).remove([meta.ruta_storage]);

    const { error: dbError } = await supabase
      .from('documentos_metadata')
      .delete()
      .eq('id', documentId);

    if (dbError) return NextResponse.json({ error: 'Error eliminando documento' }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Documento eliminado correctamente' });

  } catch (err: any) {
    console.error('DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar' }, { status: 500 });
  }
}