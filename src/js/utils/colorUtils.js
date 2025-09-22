import * as Cesium from 'cesium';

// Ambang (meter): 0–0.4m, 0.4–1.0m, 1.0–1.8m, >1.8m
export const WATER_THRESHOLDS_M = [0.4, 1.0, 1.8];

export const WATER_COLORS = {
    c0: Cesium.Color.fromCssColorString('#00BFFF').withAlpha(0.78), // 0–40 cm
    c1: Cesium.Color.fromCssColorString('#008FE6').withAlpha(0.78), // 40–100 cm (turunin L cukup jauh)
    c2: Cesium.Color.fromCssColorString('#0062CC').withAlpha(0.80), // 100–180 cm
    c3: Cesium.Color.fromCssColorString('#003080').withAlpha(0.85), // >180 cm (lebih gelap jelas)
};

// Tentukan warna dari kedalaman (meter)
export function colorByDepth(depthM, palette = WATER_COLORS, thresholds = WATER_THRESHOLDS_M) {
  if (depthM < thresholds[0]) return palette.c0;
  if (depthM < thresholds[1]) return palette.c1;
  if (depthM < thresholds[2]) return palette.c2;
  return palette.c3;
}

// Bikin ColorMaterialProperty dinamis berdasarkan fungsi pengambil "depth"
export function createDepthColorMaterial(depthGetter, palette = WATER_COLORS, thresholds = WATER_THRESHOLDS_M) {
  const colorProp = new Cesium.CallbackProperty((time) => {
    const d = depthGetter(time) || 0;
    return colorByDepth(d, palette, thresholds);
  }, false);

  return new Cesium.ColorMaterialProperty(colorProp);
}

// Opsional: buat legend UI
export const WATER_COLOR_LEGEND = [
  { range: '0 – 40 cm',   color: WATER_COLORS.c0 },
  { range: '40 – 100 cm', color: WATER_COLORS.c1 },
  { range: '100 – 180 cm',color: WATER_COLORS.c2 },
  { range: '> 180 cm',  color: WATER_COLORS.c3 },
];
