// Ambang (meter): 0–0.4m, 0.4–1.0m, 1.0–1.8m, >1.8m
export const WATER_THRESHOLDS_M = [0.4, 1.0, 1.8];

// Definisi warna dalam format hex + alpha (untuk di-convert saat runtime)
export const WATER_COLOR_DEFS = {
    c0: { hex: '#00BFFF', alpha: 0.78 }, // 0–40 cm
    c1: { hex: '#008FE6', alpha: 0.78 }, // 40–100 cm
    c2: { hex: '#0062CC', alpha: 0.80 }, // 100–180 cm
    c3: { hex: '#003080', alpha: 0.85 }, // >180 cm
};

// Cache untuk Cesium Color objects (di-initialize saat pertama kali dipanggil)
let _waterColors = null;

/**
 * Get WATER_COLORS dengan lazy initialization
 * @param {typeof import('cesium')} Cesium 
 * @returns {Object} Object berisi Cesium.Color untuk setiap level
 */
export function getWaterColors(Cesium) {
  if (!_waterColors) {
    _waterColors = {
      c0: Cesium.Color.fromCssColorString(WATER_COLOR_DEFS.c0.hex).withAlpha(WATER_COLOR_DEFS.c0.alpha),
      c1: Cesium.Color.fromCssColorString(WATER_COLOR_DEFS.c1.hex).withAlpha(WATER_COLOR_DEFS.c1.alpha),
      c2: Cesium.Color.fromCssColorString(WATER_COLOR_DEFS.c2.hex).withAlpha(WATER_COLOR_DEFS.c2.alpha),
      c3: Cesium.Color.fromCssColorString(WATER_COLOR_DEFS.c3.hex).withAlpha(WATER_COLOR_DEFS.c3.alpha),
    };
  }
  return _waterColors;
}

// Tentukan warna dari kedalaman (meter)
export function colorByDepth(depthM, palette, thresholds = WATER_THRESHOLDS_M) {
  if (depthM < thresholds[0]) return palette.c0;
  if (depthM < thresholds[1]) return palette.c1;
  if (depthM < thresholds[2]) return palette.c2;
  return palette.c3;
}

/**
 * Bikin ColorMaterialProperty dinamis berdasarkan fungsi pengambil "depth"
 * @param {typeof import('cesium')} Cesium 
 * @param {Function} depthGetter 
 * @param {Object} palette 
 * @param {Array} thresholds 
 */
export function createDepthColorMaterial(Cesium, depthGetter, palette = null, thresholds = WATER_THRESHOLDS_M) {
  const colors = palette || getWaterColors(Cesium);
  
  const colorProp = new Cesium.CallbackProperty((time) => {
    const d = depthGetter(time) || 0;
    return colorByDepth(d, colors, thresholds);
  }, false);

  return new Cesium.ColorMaterialProperty(colorProp);
}

/**
 * Get legend data untuk UI
 * @param {typeof import('cesium')} Cesium 
 */
export function getWaterColorLegend(Cesium) {
  const colors = getWaterColors(Cesium);
  return [
    { range: '0 – 40 cm',   color: colors.c0 },
    { range: '40 – 100 cm', color: colors.c1 },
    { range: '100 – 180 cm', color: colors.c2 },
    { range: '> 180 cm',  color: colors.c3 },
  ];
}
