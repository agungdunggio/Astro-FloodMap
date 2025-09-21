// src/js/dataLoader.js
import * as Cesium from 'cesium';

export let waterLevelEntities = [];
export const startHeight = 63; 

/**
 * Mendapatkan data historis dari entities yang sudah di-load
 * @param {string} kecamatanName - Nama kecamatan (opsional)
 * @returns {Object|null} Data historis
 */
export function getHistoricalData(kecamatanName = null) {
  if (!waterLevelEntities || waterLevelEntities.length === 0) {
    console.warn('Tidak ada water level entities yang tersedia');
    return null;
  }

  // Jika tidak ada nama kecamatan, gunakan yang pertama
  if (!kecamatanName) {
    const firstEntity = waterLevelEntities[0];
    if (firstEntity && firstEntity.historicalData) {
      return firstEntity.historicalData;
    }
  }

  // Cari kecamatan yang sesuai
  const targetEntity = waterLevelEntities.find(entity => 
    entity.historicalData && entity.historicalData.kecamatan === kecamatanName
  );

  if (targetEntity && targetEntity.historicalData) {
    return targetEntity.historicalData;
  }

  // Fallback ke yang pertama
  const firstEntity = waterLevelEntities[0];
  if (firstEntity && firstEntity.historicalData) {
    console.warn(`Kecamatan ${kecamatanName} tidak ditemukan, menggunakan ${firstEntity.historicalData.kecamatan}`);
    return firstEntity.historicalData;
  }

  return null;
}

/**
 * Mendapatkan daftar kecamatan yang tersedia
 * @returns {Array} Daftar kecamatan
 */
export function getAvailableKecamatan() {
  if (!waterLevelEntities || waterLevelEntities.length === 0) {
    return [];
  }

  return waterLevelEntities
    .filter(entity => entity.historicalData)
    .map(entity => ({
      name: entity.historicalData.kecamatan,
      trise: entity.historicalData.height,
      rrise: entity.historicalData.riseRate,
      entity: entity
    }));
}

// Layer management
export let currentAdminLayer = null;
export let currentLabelLayer = null;
export let currentAdminEntities = []; // Track entities created from polygons

export async function loadWaterLevelGeoJson(viewer, geoJsonUrl) {
  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl);
    viewer.dataSources.add(dataSource);
    waterLevelEntities = dataSource.entities.values; // Update variabel global/module

    console.log(`📊 Loaded ${waterLevelEntities.length} water level entities from ${geoJsonUrl}`);

    waterLevelEntities.forEach((entity) => {
      if (Cesium.defined(entity.polygon)) {
        // Ambil properti TRISE (cm) dan RRISE (cm/s) dari kecamatan.json
        const totalRise_cm = entity.properties?.TRISE?.getValue() || 0;
        const riseRate_cmps = entity.properties?.RRISE?.getValue() || 0;
        const kecamatanName = entity.properties?.WADMKC?.getValue() || 'Unknown';
        const precipitation = parseFloat(import.meta.env.PUBLIC_PRECIPITATION) || 0;
        const duration = parseFloat(import.meta.env.PUBLIC_DURATION) || 0;

        // Simpan data historis di entity untuk digunakan di simulationManager
        entity.historicalData = {
          kecamatan: kecamatanName,
          height: totalRise_cm, // cm
          riseRate: riseRate_cmps, // cm/s
          precipitation: precipitation,
          duration: duration,
        };

        // Konversi ke meter untuk internal use
        entity.totalRise_m = totalRise_cm / 100.0;
        entity.riseRate_mps = riseRate_cmps / 100.0; // cm/s ke m/s

        // Optimasi styling polygon untuk performa yang lebih baik
        entity.polygon.material = Cesium.Color.fromCssColorString("#00BFFF").withAlpha(0.7);
        entity.polygon.outline = false; // Hapus outline
        entity.polygon.height = startHeight;                  // top = -50 m
        entity.polygon.extrudedHeight = startHeight;
        entity.polygon.perPositionHeight = false;
        entity.polygon.heightReference = Cesium.HeightReference.NONE;
        entity.polygon.extrudedHeightReference = Cesium.HeightReference.NONE;
        
        // Optimasi tambahan untuk performa
        entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
        entity.polygon.show = true;
      }
    });

    // Log summary saja untuk menghindari spam console
    if (waterLevelEntities.length > 0) {
      const firstEntity = waterLevelEntities[0];
      if (firstEntity.historicalData) {
        console.log(`📋 Data historis siap: ${waterLevelEntities.length} kecamatan loaded`);
      }
    }

  } catch (error) {
    console.error("Gagal memuat Water Level GeoJSON:", error);
  }
}

export async function loadAdminBoundaryGeoJson(viewer, geoJsonUrl) {
  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, { clampToGround: true });
    viewer.dataSources.add(dataSource);
    dataSource.entities.values.forEach((entity) => {
      if (Cesium.defined(entity.polyline)) {
        entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Cesium.Color.YELLOW,
        });
        entity.polyline.width = 5;
      } else if (Cesium.defined(entity.polygon)) {
        const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
        const positions = hierarchy.positions;
        // Buat polyline mengikuti terrain
        viewer.entities.add({
          polyline: {
            positions: positions,
            clampToGround: true,
            width: 3,
            material: Cesium.Color.YELLOW
          }
        });
        // Polygon bisa dibuat transparan / non-fill
        entity.polygon.fill = false;
        entity.polygon.outline = false; // outline default dimatikan
      }
    });
  } catch (error) {
    console.error("Gagal memuat Admin Boundary GeoJSON:", error);
  }
}

/**
 * Load administrative boundaries (kecamatan atau kelurahan)
 * @param {Cesium.Viewer} viewer 
 * @param {string} layerType - 'kecamatan' atau 'kelurahan'
 */
export async function loadAdminLayer(viewer, layerType = 'kecamatan') {
  try {
    // Hapus layer admin yang ada sebelumnya
    if (currentAdminLayer) {
      viewer.dataSources.remove(currentAdminLayer);
      currentAdminLayer = null;
    }

    // Hapus entities yang dibuat dari polygon sebelumnya
    currentAdminEntities.forEach(entity => {
      viewer.entities.remove(entity);
    });
    currentAdminEntities = [];

    const geoJsonUrl = layerType === 'kecamatan' 
      ? '/data/geojson/administrasi/batas_admn_kecamatan.json'
      : '/data/geojson/administrasi/batas_admn_kelurahan.json';

    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, { clampToGround: true });
    viewer.dataSources.add(dataSource);
    currentAdminLayer = dataSource;

    // Styling berdasarkan tipe layer
    const color = layerType === 'kecamatan' ? Cesium.Color.ORANGE : Cesium.Color.YELLOW;
    const width = layerType === 'kecamatan' ? 3.5 : 3.5;

    dataSource.entities.values.forEach((entity) => {
      if (Cesium.defined(entity.polyline)) {
        entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: color,
        });
        entity.polyline.width = width;
      } else if (Cesium.defined(entity.polygon)) {
        const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
        const positions = hierarchy.positions;
        // Buat polyline mengikuti terrain dan simpan referensinya
        const polylineEntity = viewer.entities.add({
          polyline: {
            positions: positions,
            clampToGround: true,
            width: width,
            material: color
          }
        });
        currentAdminEntities.push(polylineEntity);
        // Polygon bisa dibuat transparan / non-fill
        entity.polygon.fill = false;
        entity.polygon.outline = false;
      }
    });

    console.log(`Layer administrasi ${layerType} berhasil dimuat`);
  } catch (error) {
    console.error(`Gagal memuat layer administrasi ${layerType}:`, error);
  }
}

/**
 * Load labels (kecamatan atau kelurahan)
 * @param {Cesium.Viewer} viewer 
 * @param {string} layerType - 'kecamatan' atau 'kelurahan'
 */
export async function loadLabelLayer(viewer, layerType = 'kecamatan') {
  try {
    // Hapus label layer yang ada sebelumnya
    if (currentLabelLayer) {
      currentLabelLayer.forEach(entity => {
        viewer.entities.remove(entity);
      });
      currentLabelLayer = null;
    }

    const labelJsonUrl = layerType === 'kecamatan' 
      ? '/data/geojson/administrasi/labelKecamatan.json'
      : '/data/geojson/administrasi/labelKelurahan.json';

    const response = await fetch(labelJsonUrl);
    const labelData = await response.json();
    
    currentLabelLayer = [];
    
    labelData.forEach((label) => {
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(label.lon, label.lat, 50),
        label: {
          text: label.text,
          font: layerType === 'kecamatan' ? "16pt sans-serif" : "14pt sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      currentLabelLayer.push(entity);
    });

    console.log(`Label layer ${layerType} berhasil dimuat`);
  } catch (error) {
    console.error(`Gagal memuat label layer ${layerType}:`, error);
  }
}

/**
 * Switch between kecamatan and kelurahan layers
 * @param {Cesium.Viewer} viewer 
 * @param {string} layerType - 'kecamatan' atau 'kelurahan'
 */
export async function switchAdminLayer(viewer, layerType) {
  await loadAdminLayer(viewer, layerType);
  await loadLabelLayer(viewer, layerType);
}

// Backward compatibility
export async function addLabels(viewer, labelJsonUrl = '/data/geojson/administrasi/labelKelurahan.json') {
  // Determine layer type from URL
  const layerType = labelJsonUrl.includes('labelKecamatan') ? 'kecamatan' : 'kelurahan';
  await loadLabelLayer(viewer, layerType);
}

/**
 * Reset ketinggian air ke nilai awal statis
 * Menghapus CallbackProperty dan menggunakan nilai tetap
 */
export function resetWaterLevelToStatic() {
  waterLevelEntities.forEach((entity) => {
    if (Cesium.defined(entity.polygon)) {
      entity.polygon.height = startHeight;
      entity.polygon.extrudedHeight = startHeight;
      entity.polygon.heightReference = Cesium.HeightReference.NONE;
      entity.polygon.extrudedHeightReference = Cesium.HeightReference.NONE;
      entity.polygon.material = Cesium.Color.fromCssColorString("#00BFFF").withAlpha(0.7);
    }
  });
  console.log(`Water level direset ke ground level: 0m`);
}

/**
 * Clean up all layer data to prevent memory leaks
 * @param {Cesium.Viewer} viewer 
 */
export function cleanupAllLayers(viewer) {
  // Clean up admin layer
  if (currentAdminLayer) {
    viewer.dataSources.remove(currentAdminLayer);
    currentAdminLayer = null;
  }
  
  // Clean up admin entities
  currentAdminEntities.forEach(entity => {
    viewer.entities.remove(entity);
  });
  currentAdminEntities = [];
  
  // Clean up label layer
  if (currentLabelLayer) {
    currentLabelLayer.forEach(entity => {
      viewer.entities.remove(entity);
    });
    currentLabelLayer = null;
  }
  
  console.log('All layers cleaned up');
}