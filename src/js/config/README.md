# Cesium Page Configuration System

## Overview

Sistem konfigurasi yang memungkinkan setup halaman Cesium yang modular dan dapat dikustomisasi.

## Structure

```
src/js/
├── config/
│   ├── pageConfigs.js     # Konfigurasi untuk berbagai jenis halaman
│   └── README.md          # Dokumentasi ini
├── core/
│   └── cesiumInitializer.js # Universal initializer
├── utils/
│   └── pageUtils.js       # Utility functions
└── mainCesium.js          # Entry point (backward compatibility)
```

## Cara Menambah Halaman Baru

### 1. Tambahkan Konfigurasi

Di `pageConfigs.js`, tambahkan konfigurasi baru:

```javascript
export const PAGE_CONFIGS = {
  // ... existing configs

  NEW_PAGE: {
    name: 'nama-halaman-baru',
    dataLayers: [
      { type: 'waterLevel', path: '/data/geojson/water/waterLevel.json' },
      { type: 'adminBoundary', path: '/data/geojson/administrasi/custom.json' }
    ],
    features: {
      simulation: false,
      uiControls: true,
      clockEvents: false,
      labels: true,
      customFeature: true  // Custom feature
    },
    logMessage: 'Halaman Baru berhasil diinisialisasi.'
  }
};
```

### 2. Update Core Initializer (jika perlu)

Jika ada fitur custom, tambahkan di `cesiumInitializer.js`:

```javascript
function initializeFeatures(viewer, features) {
  // ... existing features
  
  if (features.customFeature) {
    initializeCustomFeature(viewer);
  }
}
```

### 3. Buat Function Helper

Di `mainCesium.js` atau file terpisah:

```javascript
export async function initializeNewPage() {
  return await initializeCesiumPage('NEW_PAGE');
}
```

### 4. Gunakan di Halaman Astro

```astro
<script>
  import { initializeNewPage } from '../js/mainCesium.js';
  import { initializePage } from '../js/utils/pageUtils.js';
  
  initializePage(initializeNewPage, 'Nama Halaman Baru');
</script>
```

## Konfigurasi Yang Tersedia

### Data Layers

- `waterLevel`: Layer ketinggian air
- `adminBoundary`: Batas administrasi

### Features

- `simulation`: Aktivasi simulasi banjir
- `uiControls`: UI controls untuk simulasi
- `clockEvents`: Event timeline/clock
- `labels`: Label pada peta
- `petaDasarUI`: UI khusus peta dasar

## Extending System

### Menambah Layer Type Baru

1. Tambahkan di `LAYER_LOADERS`:
```javascript
export const LAYER_LOADERS = {
  // ... existing
  newLayerType: 'loadNewLayerFunction'
};
```

2. Import dan tambahkan function loader di `cesiumInitializer.js`

### Menambah Feature Baru

1. Tambahkan kondisi di `initializeFeatures()`
2. Import function yang dibutuhkan
3. Update konfigurasi halaman yang membutuhkan

## Error Handling

Sistem menggunakan comprehensive error handling:

- ✅ Try-catch untuk setiap layer loading
- ✅ Validation konfigurasi
- ✅ User-friendly error messages
- ✅ Console logging yang informatif

## Best Practices

1. **Naming Convention**: Gunakan UPPER_CASE untuk config keys
2. **Error Handling**: Selalu wrap initialization dalam `initializePage()`
3. **Modularity**: Pisahkan concern ke file yang sesuai
4. **Documentation**: Update README ketika menambah feature baru
