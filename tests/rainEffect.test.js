import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cesium', () => {
  class Cartesian3 {
    static add(a, b, out) { return out || new Cartesian3(); }
    static clone(v) { return new Cartesian3(); }
    static multiplyByScalar(v, s, out) { return out || new Cartesian3(); }
    constructor() {}
  }
  class Cartesian2 { constructor() {} }
  class Matrix4 { static fromTranslation() { return {}; } }
  class Color {
    static get WHITE() { return { withAlpha: () => ({}) }; }
  }
  class BoxEmitter { constructor() {} }
  class ParticleSystem { constructor() {} }

  return {
    Cartesian3,
    Cartesian2,
    Matrix4,
    Color,
    BoxEmitter,
    ParticleSystem,
  };
});

function makeScene() {
  const preHandlers = new Set();
  return {
    camera: { position: {} },
    primitives: {
      _primitives: [],
      add: vi.fn(function(obj){ this._primitives.push(obj); return obj; }),
      remove: vi.fn(function(obj){ this._primitives = this._primitives.filter(p => p !== obj); return true; })
    },
    preRender: {
      addEventListener: vi.fn((fn) => preHandlers.add(fn)),
      removeEventListener: vi.fn((fn) => preHandlers.delete(fn)),
    },
    skyAtmosphere: { hueShift: 0, saturationShift: 0, brightnessShift: 0 },
    fog: { density: 0, minimumBrightness: 0 },
  };
}

describe('rainEffect', () => {
  let addRainEffect, removeRainEffect, addRainEffectForKecamatan, removeRainEffectForKecamatan;

  beforeEach(async () => {
    vi.resetModules();
    ({ addRainEffect, removeRainEffect, addRainEffectForKecamatan, removeRainEffectForKecamatan } = await import('../src/js/rainEffect.js'));
  });

  it('addRainEffect menambahkan ParticleSystem dan set atmos/fog; removeRainEffect membersihkan', async () => {
    const scene = makeScene();
    addRainEffect(scene);
    expect(scene.primitives.add).toHaveBeenCalledTimes(1);
    expect(scene.skyAtmosphere.hueShift).not.toBe(0);
    expect(scene.fog.density).not.toBe(0);

    removeRainEffect(scene);
    expect(scene.primitives.remove).toHaveBeenCalledTimes(1);
    expect(scene.skyAtmosphere.hueShift).toBe(0);
    expect(scene.fog.density).toBeGreaterThanOrEqual(0);
  });
});