import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cesium', () => {
  return {
    defined: (v) => v !== undefined && v !== null,
    JulianDate: {
      toDate: (jul) => {
        // jul bisa berupa Date langsung dalam test kita
        if (jul instanceof Date) return jul;
        if (jul && typeof jul.getTime === 'function') return new Date(jul.getTime());
        // fallback: sekarang
        return new Date('2025-06-05T13:28:20Z');
      },
    },
  };
});

describe('formatToWita', () => {
  let formatJulianDateToWITA, formatJulianTimeToWITA, formatJulianDateToShortWITAForTimeline;

  beforeEach(async () => {
    vi.resetModules();
    ({
      formatJulianDateToWITA,
      formatJulianTimeToWITA,
      formatJulianDateToShortWITAForTimeline
    } = await import('../src/js/Cesium/formatToWita.js'));
  });

  it('formatJulianDateToWITA mengembalikan tanggal WITA (Asia/Makassar)', () => {
    const d = new Date('2025-06-05T00:00:00Z');
    const out = formatJulianDateToWITA(d);
    expect(typeof out).toBe('string');
    expect(out).toMatch(/2025/);
  });

  it('formatJulianTimeToWITA menambahkan label WITA dan format HH:MM:SS', () => {
    const d = new Date('2025-06-05T13:28:20Z');
    const out = formatJulianTimeToWITA(d);
    expect(out).toMatch(/WITA$/);
    expect(out).toMatch(/\d{2}[.:]\d{2}[.:]\d{2}/);
  });

  it('formatJulianDateToShortWITAForTimeline format pendek HH:MM WITA', () => {
    const d = new Date('2025-06-05T13:28:20Z');
    const out = formatJulianDateToShortWITAForTimeline(d);
    expect(out).toMatch(/\d{2}[.:]\d{2} WITA$/);
  });

  it('mengembalikan string kosong jika input tidak didefinisikan', () => {
    expect(formatJulianDateToWITA(null)).toBe('');
    expect(formatJulianTimeToWITA(undefined)).toBe('');
    expect(formatJulianDateToShortWITAForTimeline(null)).toBe('');
  });
});