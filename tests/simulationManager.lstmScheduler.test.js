import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('cesium', () => {
  class JulianDate {
    static fromDate(d) { return new JulianDate(d.getTime()); }
    static addHours(start, h) { return new JulianDate(start.value + h * 3600 * 1000); }
    static greaterThanOrEquals(a, b) { return a.value >= b.value; }
    static lessThan(a, b) { return a.value < b.value; }
    static greaterThan(a, b) { return a.value > b.value; }
    static toDate(j) { return new Date(j.value); }
    static secondsDifference(a, b) { return (a.value - b.value) / 1000; }
    constructor(v) { this.value = typeof v === 'number' ? v : Date.now(); }
    clone() { return new JulianDate(this.value); }
  }
  class CallbackProperty { constructor(cb) { this._callback = cb; } }
  return {
    JulianDate,
    CallbackProperty,
    HeightReference: { NONE: 0 },
  };
});

vi.mock('../src/js/utils/colorUtils.js', () => ({
  createDepthColorMaterial: vi.fn(() => ({})),
}));

vi.mock('../src/js/rainEffect.js', () => ({
  addRainEffect: vi.fn(),
  removeRainEffect: vi.fn(),
  removeRainEffectForKecamatan: vi.fn(),
  currentRainParticleSystem: null,
}));

vi.mock('../src/js/dataLoader.js', () => {
  const entity = {
    historicalData: { kecamatan: 'Any', baseHeight: 1.25, riseRate: 0.02, precipitation: 50 },
    polygon: {}
  };
  return { waterLevelEntities: [entity] };
});

describe('enableScheduledLSTMFlood (jadwal harian 12:00–18:00)', () => {
  let enableScheduledLSTMFlood;
  let Cesium;
  let savedOnTick;

  beforeEach(async () => {
    vi.resetModules();
    ({ enableScheduledLSTMFlood } = await import('../src/js/simulationManager.js'));
    Cesium = await import('cesium');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createViewer(atDate) {
    const jd = Cesium.JulianDate.fromDate(atDate);
    return {
      scene: {},
      clock: {
        currentTime: jd,
        onTick: {
          addEventListener: vi.fn((fn) => { savedOnTick = fn; }),
          removeEventListener: vi.fn()
        },
      },
    };
  }

  it('menjalankan simulasi global untuk hari dengan mm>0 pada 12:00–18:00, pasang CallbackProperty dan efek hujan', async () => {
    const predictions = [
      { date: '2025-02-01', value: 0 },
      { date: '2025-02-02', value: 15 },
    ];

    const day = predictions[1].date; // '2025-02-02'
    const wStartLocal = new Date(day + 'T12:00:00'); // start window lokal
    const current = new Date(wStartLocal.getTime() + 3 * 3600 * 1000); // 15:00 lokal
    const viewer = createViewer(current);

    enableScheduledLSTMFlood(viewer, predictions, 6);
    savedOnTick(viewer.clock);

    const { waterLevelEntities } = await import('../src/js/dataLoader.js');
    const entity = waterLevelEntities[0];
    const { addRainEffect } = await import('../src/js/rainEffect.js');

    expect(entity.polygon.height).toBeInstanceOf(Cesium.CallbackProperty);

    const startWindow = Cesium.JulianDate.fromDate(wStartLocal);

    const tPlus10s = Cesium.JulianDate.addHours(startWindow, 3 + (10/3600)); // 3 jam + 10 detik
    const seconds = Cesium.JulianDate.secondsDifference(tPlus10s, startWindow);

    const mm = predictions[1].value;
    const rate = (entity.historicalData.riseRate / 100) * (mm / entity.historicalData.precipitation);
    const expected = entity.historicalData.baseHeight + rate * seconds;

    const hCb = entity.polygon.height._callback;
    const actual = hCb(tPlus10s);
    expect(actual).toBeCloseTo(expected, 5);
  });
});