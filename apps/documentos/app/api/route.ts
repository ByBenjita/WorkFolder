import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptBuffer, decryptBuffer } from '@workfolder/utils';

// Configuración de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const BUCKET_NAME = 'documentos_cifrados';

// -------------------------------------------------------------------------
// POST: Recibir archivo -> Cifrar -> Subir a Storage -> Guardar Metadata
// -------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Convertir a Buffer y Cifrar (Equivalente a tu encrypt.py)
    const arrayBuffer = await file.arrayBuffer();
    const encryptedBuffer = encryptBuffer(Buffer.from(arrayBuffer), ENCRYPTION_KEY);

    // Definir ruta en Storage (S3 Supabase)
    const storagePath = `${userId}/${Date.now()}_${file.name}.enc`;

    // 1. Subir al Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, encryptedBuffer, { contentType: 'application/octet-stream' });

    if (storageError) throw storageError;

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

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// -------------------------------------------------------------------------
// GET: Obtener Metadata -> Descargar de Storage -> Descifrar -> Entregar
// -------------------------------------------------------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  try {
    // 1. Buscar metadata para saber qué archivo descargar
    const { data: meta, error: metaError } = await supabase
      .from('documentos_metadata')
      .select('*')
      .eq('id', id)
      .single();

    if (metaError) throw metaError;

    // 2. Descargar el archivo cifrado
    const { data: fileData, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(meta.ruta_storage);

    if (storageError) throw storageError;

    // 3. Descifrar (Equivalente a tu decrypt.py)
    const encryptedBuffer = Buffer.from(await fileData.arrayBuffer());
    const decryptedBuffer = decryptBuffer(encryptedBuffer, ENCRYPTION_KEY);

    // 4. Retornar archivo al navegador
    return new NextResponse(decryptedBuffer as any, {
      headers: {
        'Content-Type': meta.tipo_mime,
        'Content-Disposition': `attachment; filename="${meta.nombre_original}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// -------------------------------------------------------------------------
// DELETE: Borrar archivo del Storage y la Metadata
// -------------------------------------------------------------------------
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    const { data: meta } = await supabase.from('documentos_metadata').select('ruta_storage').eq('id', id).single();
    if (!meta) throw new Error('Archivo no encontrado');

    await supabase.storage.from(BUCKET_NAME).remove([meta.ruta_storage]);
    await supabase.from('documentos_metadata').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}