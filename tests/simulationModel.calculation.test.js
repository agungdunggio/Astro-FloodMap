import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sumber data historis dari dataLoader
vi.mock('../src/js/dataLoader.js', () => ({
  getHistoricalData: vi.fn(() => ({
    kecamatan: 'TestKec',
    // nilai historis yang dipakai calculateFloodRise
    precipitation: 50,  // mm historis
    riseRate: 0.02,     // cm/s historis
    baseHeight: 1.5,    // m (tidak dipakai oleh fungsi ini, tapi realistis)
  })),
}));

describe('Perhitungan pemodelan banjir (calculateFloodRise)', () => {
  const modulePath = '../src/js/simulationManager.js';

  beforeEach(() => {
    vi.resetModules();
  });

  it('menghitung faktor, laju kenaikan (m/s), dan total kenaikan (m) dengan input valid', async () => {
    const { calculateFloodRise } = await import(modulePath);
    const rainMm = 100;       // 2x dari historis 50
    const durationHours = 2;  // 2 jam

    const out = calculateFloodRise(rainMm, durationHours);

    // Faktor presipitasi 100/50 = 2
    expect(out.precipitationFactor).toBeCloseTo(2, 6);

    // RiseRate historis 0.02 cm/s, dikali faktor 2 = 0.04 cm/s => 0.0004 m/s
    expect(out.newRiseRate).toBeCloseTo(0.0004, 6);

    // Total kenaikan 0.0004 m/s * (2 * 3600 s) = 2.88 m
    expect(out.totalRise).toBeCloseTo(2.88, 2);
  });

  it('melempar error saat rainMm <= 0', async () => {
    const { calculateFloodRise } = await import(modulePath);
    expect(() => calculateFloodRise(0, 1)).toThrow();
  });

  it('melempar error saat durationHours <= 0', async () => {
    const { calculateFloodRise } = await import(modulePath);
    expect(() => calculateFloodRise(10, 0)).toThrow();
  });
});