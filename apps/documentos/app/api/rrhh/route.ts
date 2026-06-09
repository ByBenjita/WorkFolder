import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'rrhh_documentos';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

async function checkAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.app_metadata?.role === 'admin';
}

// GET /api/rrhh?download=<id> — descarga binaria del archivo
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const downloadId = req.nextUrl.searchParams.get('download');
  if (!downloadId) {
    return NextResponse.json({ error: 'Parámetro download requerido' }, { status: 400 });
  }

  const admin = await checkAdmin(user.id);

  const { data: doc } = await supabase
    .from('rrhh_documentos')
    .select('id, storage_path, nombre_original, asignado_a')
    .eq('id', downloadId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  if (!admin && doc.asignado_a !== user.id) {
    return NextResponse.json({ error: 'Sin permisos para descargar este documento' }, { status: 403 });
  }

  const { data: fileData, error: dlError } = await supabase.storage
    .from(BUCKET)
    .download(doc.storage_path);

  if (dlError || !fileData) {
    return NextResponse.json({ error: 'Error al descargar el archivo' }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.nombre_original)}"`,
      'Cache-Control':       'no-store',
    },
  });
}

// POST /api/rrhh — subir y asignar documento RRHH (solo admins)
// FormData: file, asignadoA, asignadoAEmail, asignadoANombre?, tipo, periodo?
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!(await checkAdmin(user.id))) {
    return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 });
  }

  const form            = await req.formData();
  const file            = form.get('file') as File | null;
  const asignadoA       = form.get('asignadoA') as string | null;
  const asignadoAEmail  = form.get('asignadoAEmail') as string | null;
  const asignadoANombre = form.get('asignadoANombre') as string | null;
  const tipo            = form.get('tipo') as string | null;
  const periodo         = form.get('periodo') as string | null;

  if (!file || !asignadoA || !asignadoAEmail || !tipo) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: file, asignadoA, asignadoAEmail, tipo' },
      { status: 400 }
    );
  }

  const nombreSanitizado = file.name.replace(/[^a-zA-Z0-9._\-áéíóúñÁÉÍÓÚÑ ]/g, '_');
  const storagePath      = `${asignadoA}/${Date.now()}_${nombreSanitizado}`;
  const buffer           = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data, error } = await supabase
    .from('rrhh_documentos')
    .insert({
      storage_path:      storagePath,
      nombre_original:   file.name,
      asignado_a:        asignadoA,
      asignado_a_email:  asignadoAEmail,
      asignado_a_nombre: asignadoANombre ?? null,
      asignado_por:      user.id,
      tipo,
      periodo:           periodo || null,
      tamano_bytes:      file.size,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}

// DELETE /api/rrhh?id=<id> — eliminar documento (solo admins)
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!(await checkAdmin(user.id))) {
    return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id del documento' }, { status: 400 });

  const { data: doc } = await supabase
    .from('rrhh_documentos')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

  await supabase.storage.from(BUCKET).remove([doc.storage_path]);

  const { error } = await supabase.from('rrhh_documentos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
