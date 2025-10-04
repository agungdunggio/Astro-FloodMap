import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cesium', () => {
    class Color {
      static fromCssColorString(str) {
        return {
          withAlpha: (a) => ({ css: str, alpha: a })
        };
      }
      static get YELLOW() { return {}; }
      static get ORANGE() { return {}; }
      static get WHITE() { return {}; }
      static get BLACK() { return {}; }
    }
  
    class PolylineGlowMaterialProperty { constructor(){} }
    class JulianDate { static now(){ return {}; } }
    class Cartesian2 { constructor(){} }
    class Cartesian3 { static fromDegrees(){ return {}; } }
    class ClassificationType { static get TERRAIN(){ return 0; } }
    class HeightReference { static get NONE(){ return 0; } static get RELATIVE_TO_GROUND(){ return 1; } }
  
    class GeoJsonDataSource {
      static async load(url){
        const mockEntity = { polygon: { hierarchy: { getValue(){ return { positions: [{}] }; } }, fill: true, outline: true } };
        return { entities: { values: [mockEntity] } };
      }
    }
  
    const defined = (v) => v !== undefined && v !== null;
    return {
      Color,
      PolylineGlowMaterialProperty,
      JulianDate,
      Cartesian2,
      Cartesian3,
      ClassificationType,
      HeightReference,
      GeoJsonDataSource,
      LabelStyle: { FILL_AND_OUTLINE: 1 },
      VerticalOrigin: { BOTTOM: 2 },
      defined
    };
});
  

function createViewer(){
  return {
    dataSources: { add: vi.fn(), remove: vi.fn() },
    entities: { add: vi.fn(() => ({})), remove: vi.fn() }
  };
}

describe('dataLoader boundaries & labels', () => {
  let moduleRef, loadAdminLayer, loadLabelLayer, switchAdminLayer;

  beforeEach(async () => {
    vi.resetModules();
    moduleRef = await import('../src/js/dataLoader.js');
    ({ loadAdminLayer, loadLabelLayer, switchAdminLayer } = moduleRef);
    global.fetch = vi.fn(async (url) => ({ json: async () => ([{ text: 'X', lon: 0, lat: 0 }]) }));
  });

  it('loadAdminLayer memuat geojson dan membuat polyline dari polygon', async () => {
    const viewer = createViewer();
    await loadAdminLayer(viewer, 'kecamatan');
    expect(viewer.dataSources.add).toHaveBeenCalled();
    expect(viewer.entities.add).toHaveBeenCalled();
  });

  it('loadLabelLayer memuat label json dan menambahkan label entities', async () => {
    const viewer = createViewer();
    await loadLabelLayer(viewer, 'kecamatan');
    expect(fetch).toHaveBeenCalled();
    expect(viewer.entities.add).toHaveBeenCalled();
  });

  it('switchAdminLayer memanggil efek dari loadAdminLayer dan loadLabelLayer', async () => {
    const viewer = createViewer();
    viewer.dataSources.add.mockClear();
    viewer.entities.add.mockClear();
    global.fetch.mockClear();
    
    await moduleRef.switchAdminLayer(viewer, 'kelurahan');
    expect(viewer.dataSources.add).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalled();
  });
});