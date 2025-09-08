// src/js/config/pageConfigs.js

/**
 * Konfigurasi untuk berbagai jenis halaman Cesium
 */

export const PAGE_CONFIGS = {
  SIMULATION: {
    name: 'simulasi-banjir',
    dataLayers: [
      { type: 'waterLevel', path: '/data/geojson/water/waterLevel.json' },
      { type: 'adminBoundary', path: '/data/geojson/administrasi/areaKotaAdministrasiKotaGtlo.json' }
    ],
    features: {
      simulation: true,
      uiControls: true,
      clockEvents: true,
      labels: true
    },
    logMessage: 'Aplikasi CesiumJS Simulasi Banjir berhasil diinisialisasi.'
  },

  BASE_MAP: {
    name: 'peta-dasar',
    dataLayers: [
      { type: 'waterLevel', path: '/data/geojson/water/waterLevel.json' },
      { type: 'adminBoundary', path: '/data/geojson/administrasi/lineAdmnKec.json' },
      { type: 'adminBoundary', path: '/data/geojson/administrasi/areaKotaAdministrasiKotaGtlo.json' }
    ],
    features: {
      simulation: false,
      uiControls: false,
      clockEvents: false,
      labels: true,
      petaDasarUI: true
    },
    logMessage: 'Peta Dasar CesiumJS berhasil diinisialisasi.'
  },

  // Halaman Prediksi LSTM
  LSTM_PREDICTION: {
    name: 'prediksi-lstm',
    dataLayers: [
      { type: 'waterLevel', path: '/data/geojson/water/waterLevel.json' },
      { type: 'adminBoundary', path: '/data/geojson/administrasi/areaKotaAdministrasiKotaGtlo.json' }
    ],
    features: {
      simulation: false,
      uiControls: false,
      clockEvents: false,
      labels: true,
      lstmPrediction: true,  // 🧠 Fitur prediksi LSTM
      charts: true           // 📊 Grafik prediksi
    },
    logMessage: 'Halaman Prediksi LSTM berhasil diinisialisasi.'
  },

  // Contoh konfigurasi untuk halaman baru (future use)
  MINIMAL_VIEWER: {
    name: 'viewer-minimal',
    dataLayers: [],
    features: {
      simulation: false,
      uiControls: false,
      clockEvents: false,
      labels: false
    },
    logMessage: 'Minimal Cesium Viewer berhasil diinisialisasi.'
  }
};

/**
 * Data layer loaders mapping
 */
export const LAYER_LOADERS = {
  waterLevel: 'loadWaterLevelGeoJson',
  adminBoundary: 'loadAdminBoundaryGeoJson'
};
