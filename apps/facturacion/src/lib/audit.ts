import type { NextRequest } from 'next/server';
import { logEvent, type AuditEvent } from '@workfolder/utils';
import { supabaseAdmin } from '@/services/supabase';

/** Encola un evento de auditoría de facturación (IP tomada del request). Nunca lanza error. */
export const auditar = (req: NextRequest, event: AuditEvent) => logEvent(supabaseAdmin, req, event);
