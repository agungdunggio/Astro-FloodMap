/**
 * Get Cesium dari window global (dimuat dari CDN)
 * @returns {typeof import('cesium')}
 */
export function getCesium() {
  if (typeof window !== 'undefined' && window.Cesium) {
    return window.Cesium;
  }
  throw new Error('Cesium belum dimuat. Pastikan CDN script sudah di-load di HTML.');
}

