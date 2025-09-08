// src/js/mainCesium.js
/**
 * Entry point untuk inisialisasi halaman Cesium
 * File ini di-refactor untuk menggunakan universal initializer
 */

// Re-export functions dari core initializer untuk backward compatibility
export { 
  initializeCesiumApp, 
  initializeBaseMap, 
  initializeCesiumPage 
} from './core/cesiumInitializer.js';

/**
 * Helper function untuk halaman Prediksi LSTM
 * @returns {Promise<Cesium.Viewer|null>}
 */
export async function initializeLSTMPage() {
  const { initializeCesiumPage } = await import('./core/cesiumInitializer.js');
  return await initializeCesiumPage('LSTM_PREDICTION');
}