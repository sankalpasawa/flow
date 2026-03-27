import { generateId, nowISO } from '../../lib/db/db.web';

describe('DB Utilities', () => {
  test('generateId returns valid UUID v4 format', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('generateId returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  test('nowISO returns valid ISO string', () => {
    const iso = nowISO();
    expect(new Date(iso).toISOString()).toBe(iso);
  });
});
