import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('cesium', () => {
    class JulianDate {
      static now() { return new JulianDate(Date.now()); }
      static toDate(j) { return new Date(j.value); }
      static addSeconds(start, s) { return new JulianDate(start.value + s * 1000); }
      static secondsDifference(a, b) { return (a.value - b.value) / 1000; }
      constructor(v) { this.value = typeof v === 'number' ? v : Date.now(); }
      clone() { return new JulianDate(this.value); }
    }
  
    class CallbackProperty {
      constructor(cb) { this._callback = cb; }
    }
  
    class Color {
      constructor(r, g, b, a = 1) {
        this.r = r; this.g = g; this.b = b; this.a = a;
      }
      static fromCssColorString(css) {
        return new Color(0, 191, 255, 1);
      }
      withAlpha(alpha) {
        return new Color(this.r, this.g, this.b, alpha);
      }
    }
  
    class ColorMaterialProperty {
      constructor(color) {
        this.color = color;
      }
    }
  
    return {
      JulianDate,
      CallbackProperty,
      Color,
      ColorMaterialProperty,
      HeightReference: { NONE: 0 },
      ClockRange: { UNBOUNDED: 0, CLAMPED: 1, LOOP_STOP: 2 },
    };
});
  

vi.mock('../src/js/forecast/rainForecastScheduler.js', () => ({
  getCurrentPrecipitationMap: vi.fn(() => new Map([['Kec A', 100]])),
}));

vi.mock('../src/js/dataLoader.js', () => {
  const entity = {
    historicalData: { kecamatan: 'Kec A', baseHeight: 1.0, riseRate: 0.02, precipitation: 50 },
    polygon: {}
  };
  return {
    waterLevelEntities: [entity],
  };
});

describe('computeEntityDynamics via startFloodSimulationPerKecamatan', () => {
  let startFloodSimulationPerKecamatan;
  let Cesium;

  beforeEach(async () => {
    vi.resetModules();
    ({ startFloodSimulationPerKecamatan } = await import('../src/js/simulationManager.js'));
    Cesium = await import('cesium');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createViewer() {
    const now = Cesium.JulianDate.now();
    return {
      clock: {
        currentTime: now.clone(),
        onTick: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
        multiplier: 1,
        clockRange: 0,
      },
      scene: {},
    };
  }

  it('menyetel CallbackProperty dengan laju kenaikan sesuai computeEntityDynamics', async () => {
    const viewer = createViewer();
    await startFloodSimulationPerKecamatan(viewer, 1);

    const { waterLevelEntities } = await import('../src/js/dataLoader.js');
    const entity = waterLevelEntities[0];

    expect(entity.polygon.height).toBeInstanceOf((await import('cesium')).CallbackProperty);

    const start = viewer.clock.currentTime.clone();
    const timeAfter = (await import('cesium')).JulianDate.addSeconds(start, 10);
    const hBase = entity.historicalData.baseHeight;
    const riseRateMps = (0.02 / 100) * (100 / 50);
    const expected = hBase + riseRateMps * 10;

    const heightCb = entity.polygon.height._callback;
    const computed = heightCb(timeAfter);
    expect(computed).toBeCloseTo(expected, 6);
  });
});


