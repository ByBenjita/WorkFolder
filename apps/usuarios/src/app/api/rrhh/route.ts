import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, OPTIONS as corsOptions } from '@/lib/response';

export { corsOptions as OPTIONS };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function jsonErr(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: corsHeaders });
}

function jsonOk(data: object, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status, headers: corsHeaders });
}

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

// GET /api/rrhh — listar documentos del usuario (o todos si admin)
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return jsonErr('No autorizado', 401);

  const admin = await checkAdmin(user.id);

  let query = supabase
    .from('rrhh_documentos')
    .select('*')
    .order('creado_en', { ascending: false });

  if (!admin) query = query.eq('asignado_a', user.id);

  const { data, error } = await query;
  if (error) return jsonErr(error.message, 500);

  return jsonOk({ data, isAdmin: admin });
}

// PATCH /api/rrhh — firmar documento
// Body JSON: { id }
export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return jsonErr('No autorizado', 401);

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonErr('Body JSON inválido', 400);
  }

  const { id } = body;
  if (!id) return jsonErr('Falta el id del documento', 400);

  const { data: doc } = await supabase
    .from('rrhh_documentos')
    .select('id, asignado_a, estado')
    .eq('id', id)
    .single();

  if (!doc) return jsonErr('Documento no encontrado', 404);

  const admin = await checkAdmin(user.id);
  if (!admin && doc.asignado_a !== user.id) {
    return jsonErr('Sin permisos para firmar este documento', 403);
  }

  if (doc.estado === 'firmado') {
    return jsonErr('El documento ya fue firmado', 409);
  }

  const ahora = new Date().toISOString();

  const [{ error: firmaError }, { error: updateError }] = await Promise.all([
    supabase.from('rrhh_firmas').insert({
      rrhh_documento_id: id,
      firmado_por:       user.id,
      firmado_por_email: user.email ?? '',
      firmado_en:        ahora,
    }),
    supabase.from('rrhh_documentos').update({
      estado:     'firmado',
      firmado_en: ahora,
    }).eq('id', id),
  ]);

  if (firmaError || updateError) return jsonErr('Error al registrar la firma', 500);

  return jsonOk({ message: 'Documento firmado correctamente' });
}
