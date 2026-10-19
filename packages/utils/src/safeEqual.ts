import crypto from 'crypto';

/**
 * Compara dos secretos en tiempo constante (evita ataques de timing).
 * Compara los hash SHA-256 para que tampoco se filtre el largo del secreto.
 */
export function safeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}
