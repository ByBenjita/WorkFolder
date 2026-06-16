import { ok, OPTIONS } from '@/lib/response';
import { PLANES } from '@/data/planes';

export { OPTIONS };

export async function GET() {
  return ok({ planes: PLANES });
}
