import { describe, it, expect } from 'vitest';
import { safeEqual } from '../safeEqual';

describe('safeEqual', () => {
  it('true solo si los secretos son idénticos', () => {
    expect(safeEqual('secreto-123', 'secreto-123')).toBe(true);
    expect(safeEqual('secreto-123', 'secreto-124')).toBe(false);
  });

  it('false con largos distintos (sin lanzar error)', () => {
    expect(safeEqual('corto', 'un-secreto-mucho-mas-largo')).toBe(false);
    expect(safeEqual('', 'x')).toBe(false);
  });
});
