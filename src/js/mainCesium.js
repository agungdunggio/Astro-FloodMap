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
 * Helper functions untuk halaman-halaman khusus bisa ditambahkan di sini jika diperlukan
 * Saat ini semua initialization sudah ditangani oleh cesiumInitializer.js
 */
