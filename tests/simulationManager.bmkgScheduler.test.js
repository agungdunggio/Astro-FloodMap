import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('cesium', () => {
  class JulianDate {
    static now() { return new JulianDate(Date.now()); }
    static fromDate(d) { return new JulianDate(d.getTime()); }
    static toDate(j) { return new Date(j.value); }
    static addHours(start, h) { return new JulianDate(start.value + h * 3600 * 1000); }
    static secondsDifference(a, b) { return (a.value - b.value) / 1000; }
    static greaterThanOrEquals(a, b) { return a.value >= b.value; }
    static lessThan(a, b) { return a.value < b.value; }
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

vi.mock('../src/js/dataLoader.js', () => {
  const entity = {
    historicalData: { kecamatan: 'Kec BMKG', baseHeight: 2.0, riseRate: 0.02, precipitation: 50 },
    polygon: {}
  };
  return { waterLevelEntities: [entity] };
});

describe('BMKG scheduled per-kecamatan (enableScheduledPerKecamatanFlood)', () => {
  let enableScheduledPerKecamatanFlood;
  let Cesium;
  let savedOnTick;

  beforeEach(async () => {
    vi.resetModules();

    const now = new Date('2025-01-01T12:00:00Z');
    const iv1 = { start: new Date(now), end: new Date(now.getTime() + 3 * 3600 * 1000), precipitation: 10 };
    const iv2 = { start: new Date(iv1.end), end: new Date(iv1.end.getTime() + 3 * 3600 * 1000), precipitation: 20 };
    const iv3 = { start: new Date(iv2.end), end: new Date(iv2.end.getTime() + 3 * 3600 * 1000), precipitation: 0 };

    vi.doMock('../src/js/forecast/rainForecastScheduler.js', () => ({
      getForecastIntervalsMap: () => new Map([[
        'Kec BMKG',
        [iv1, iv2, iv3]
      ]])
    }));

    ({ enableScheduledPerKecamatanFlood } = await import('../src/js/simulationManager.js'));
    Cesium = await import('cesium');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createViewer(atDate) {
    const jd = Cesium.JulianDate.fromDate(atDate);
    return {
      clock: {
        currentTime: jd,
        onTick: {
          addEventListener: vi.fn((fn) => { savedOnTick = fn; }),
          removeEventListener: vi.fn()
        },
        multiplier: 1,
        clockRange: 0,
      },
      scene: {},
    };
  }

  it('memulai event saat berada dalam blok hujan, durasi dinamis 6 jam dan memakai max mm', async () => {
    const now = new Date('2025-01-01T13:00:00Z');
    const viewer = createViewer(now);

    enableScheduledPerKecamatanFlood(viewer, 3);
    savedOnTick(viewer.clock);

    const { waterLevelEntities } = await import('../src/js/dataLoader.js');
    const entity = waterLevelEntities[0];

    expect(entity.polygon.height).toBeInstanceOf((await import('cesium')).CallbackProperty);

    const baseHeight = entity.historicalData.baseHeight;
    const riseRateMps = (entity.historicalData.riseRate / 100) * (20 / entity.historicalData.precipitation); // (0.02/100)*(20/50)
    const totalRiseM = riseRateMps * (6 * 3600);

    const start = viewer.clock.currentTime.clone();
    const tPlus1h = Cesium.JulianDate.addHours(start, 1);
    const hCb = entity.polygon.height._callback;
    const hAt1h = hCb(tPlus1h);

    expect(hAt1h).toBeGreaterThanOrEqual(baseHeight);
    expect(hAt1h).toBeLessThanOrEqual(baseHeight + totalRiseM + 1e-6);
    expect(hAt1h).toBeCloseTo(baseHeight + riseRateMps * 3600, 4);
  });
});


