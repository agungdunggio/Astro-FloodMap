// src/js/simulationManager.js
import * as Cesium from 'cesium';
import { waterLevelEntities, resetWaterLevelToStatic, getHistoricalData, getAvailableKecamatan } from './dataLoader.js';
import { addRainEffect, removeRainEffect, currentRainParticleSystem as rainSystemFromEffectModule } from './rainEffect.js';
import { createDepthColorMaterial } from './utils/colorUtils.js';

export { getAvailableKecamatan };

// State internal modul ini untuk interval event hujan
let rainEventStartJulianDate = null;
let rainEventEndJulianDate = null;

// Variabel untuk animasi air banjir
let isAnimatingWater = false;
let waterAnimationStartTime = null;

export function initializeSimulationClockEvents(viewer) {
  viewer.clock.onTick.addEventListener(function(clock) {
    // Logika untuk efek hujan berdasarkan interval
    if (rainEventStartJulianDate && rainEventEndJulianDate) {
      const currentTime = clock.currentTime;
      const isCurrentlyInInterval = Cesium.JulianDate.greaterThanOrEquals(currentTime, rainEventStartJulianDate) &&
                                    Cesium.JulianDate.lessThan(currentTime, rainEventEndJulianDate);

      if (isCurrentlyInInterval) {
        if (!rainSystemFromEffectModule) addRainEffect(viewer.scene);
      } else {
        if (rainSystemFromEffectModule) removeRainEffect(viewer.scene);
      }
    } else {
      if (rainSystemFromEffectModule) removeRainEffect(viewer.scene);
    }

    // Logika animasi air banjir
    // CallbackProperty akan menghitung tinggi air secara otomatis berdasarkan waktu
  });
}

export function defineRainEvent(viewer, durationHours, customStartTime = null) {
  removeRainEffect(viewer.scene); // Bersihkan efek lama dulu

  // Gunakan waktu kustom jika disediakan, atau waktu clock saat ini
  const startTime = customStartTime || viewer.clock.currentTime;
  rainEventStartJulianDate = Cesium.JulianDate.clone(startTime);
  rainEventEndJulianDate = Cesium.JulianDate.addHours(rainEventStartJulianDate, durationHours, new Cesium.JulianDate());
  
  viewer.clock.shouldAnimate = true;
  console.log(`Event hujan terdefinisi dari: ${Cesium.JulianDate.toDate(rainEventStartJulianDate).toLocaleString()} hingga ${Cesium.JulianDate.toDate(rainEventEndJulianDate).toLocaleString()}`);
}

export function cancelRainEvent(viewer) {
  removeRainEffect(viewer.scene);
  rainEventStartJulianDate = null;
  rainEventEndJulianDate = null;
  console.log("Event hujan dibatalkan.");
}

/**
 * Optimasi performa untuk simulasi
 * @param {Cesium.Viewer} viewer - Cesium viewer
 * @param {Object} options - Opsi optimasi
 */
export function optimizeSimulationPerformance(viewer, options = {}) {
  const defaultOptions = {
    reducePolygonComplexity: true,
    disableShadows: true,
    reduceTerrainQuality: true,
    limitFrameRate: 30
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Optimasi scene
  if (opts.disableShadows) {
    viewer.shadows = false;
  }
  
  // Optimasi terrain
  if (opts.reduceTerrainQuality) {
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }
  
  // Limit frame rate
  if (opts.limitFrameRate) {
    viewer.targetFrameRate = opts.limitFrameRate;
  }
  
  // Optimasi rendering
  viewer.scene.globe.enableLighting = false;
  viewer.scene.globe.dynamicAtmosphereLighting = false;
  
  console.log('⚡ Optimasi performa simulasi diterapkan');
}

/**
 * Simulasi banjir dengan performa tinggi (tanpa efek hujan dan logging minimal)
 * @param {Cesium.Viewer} viewer - Cesium viewer
 * @param {number} rainMm - Curah hujan dalam mm
 * @param {number} durationHours - Durasi simulasi dalam jam
 * @param {string} kecamatanName - Nama kecamatan (opsional)
 */
export function startHighPerformanceFloodSimulation(viewer, rainMm, durationHours, kecamatanName = null) {
  const performanceOptions = {
    enableRainEffect: false,        // Matikan efek hujan
    enableDetailedLogging: false,   // Matikan logging detail
    clockMultiplier: 120,          // Percepat lebih tinggi
  };
  
  // Terapkan optimasi performa
  optimizeSimulationPerformance(viewer, {
    disableShadows: true,
    reduceTerrainQuality: true,
    limitFrameRate: 30
  });
  
  // Jalankan simulasi dengan opsi performa
  return startFloodSimulation(viewer, rainMm, durationHours, kecamatanName, performanceOptions);
}

/**
 * Menghitung kenaikan air berdasarkan rumus baru
 * @param {number} rainMm - Curah hujan dalam mm
 * @param {number} durationHours - Durasi dalam jam
 * @param {string} kecamatanName - Nama kecamatan (opsional)
 * @returns {Object} Hasil perhitungan
 */
export function calculateFloodRise(rainMm, durationHours, kecamatanName = null) {
  // Ambil data historis dari entities yang sudah di-load
  const historicalData = getHistoricalData(kecamatanName);
  
  if (!historicalData) {
    throw new Error('Data historis tidak tersedia. Pastikan data kecamatan sudah di-load.');
  }
  
  // Validasi input
  if (rainMm <= 0 || durationHours <= 0) {
    throw new Error('Curah hujan dan durasi harus lebih dari 0');
  }
  
  // Gunakan RRISE langsung dari data historis (sudah dalam cm/s)
  const historicalRiseRateCmPerSec = historicalData.riseRate;
  
  // Hitung faktor perbandingan dengan data historis
  const precipitationFactor = rainMm / historicalData.precipitation;
  
  // Hitung RiseRate baru berdasarkan faktor
  const newRiseRateCmPerSec = historicalRiseRateCmPerSec * precipitationFactor;
  
  // Konversi ke meter dan hitung total kenaikan
  const newRiseRateMPerSec = newRiseRateCmPerSec / 100; // cm ke m
  const totalRise = newRiseRateMPerSec * (durationHours * 3600);
  
  return {
    historicalRiseRate: historicalRiseRateCmPerSec,
    precipitationFactor: precipitationFactor,
    newRiseRate: newRiseRateMPerSec,
    totalRise: totalRise,
    historicalData: historicalData
  };
}
 
function computeEntityDynamics(entity, rainMm, durationHours) {
  const h = entity.historicalData;
  if (!h) return { riseRateMps: 0, totalRiseM: 0 };

  // faktor hujan relatif ke data historis entity
  const baseP = (h.precipitation && h.precipitation > 0) ? h.precipitation : rainMm;
  const f = rainMm / baseP;

  // RRISE (cm/s) -> m/s lalu diskalakan faktor hujan
  const riseRateMps = ((h.riseRate || 0) / 100) * f;

  // total kenaikan selama durasi (m)
  const totalRiseM = riseRateMps * (durationHours * 3600);

  return { riseRateMps, totalRiseM };
}


/**
 * Memulai simulasi banjir dengan animasi kenaikan air
 * @param {Cesium.Viewer} viewer - Cesium viewer
 * @param {number} rainMm - Curah hujan (mm)
 * @param {number} durationHours - Durasi (jam)
 * @param {string} kecamatanName - Nama kecamatan (opsional)
 * @param {Object} options - Opsi performa (opsional)
 */
export function startFloodSimulation(viewer, rainMm, durationHours, kecamatanName = null, options = {}) {
  const performanceOptions = {
    enableRainEffect: true,
    enableDetailedLogging: false,
    clockMultiplier: 60,
    ...options
  };

  try {
    const calculation = calculateFloodRise(rainMm, durationHours, kecamatanName);
    const durationSeconds = durationHours * 3600;

    // Atur jam viewer
    const now = Cesium.JulianDate.now();
    viewer.clock.startTime = now.clone();
    viewer.clock.currentTime = now.clone();
    viewer.clock.stopTime = Cesium.JulianDate.addSeconds(now, durationSeconds, new Cesium.JulianDate());
    viewer.clock.multiplier = performanceOptions.clockMultiplier;
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;

    waterAnimationStartTime = now.clone();
    isAnimatingWater = true;

    // Sinkronkan waktu hujan dengan simulasi
    rainEventStartJulianDate = now.clone();
    rainEventEndJulianDate = Cesium.JulianDate.addHours(rainEventStartJulianDate, durationHours, new Cesium.JulianDate());

    if (performanceOptions.enableRainEffect) {
      removeRainEffect(viewer.scene);
      addRainEffect(viewer.scene);
    }

    // Terapkan animasi ke setiap entitas
    waterLevelEntities.forEach(entity => {
      if (!entity?.polygon || !entity.historicalData) return;
    
      const baseHeight = entity.historicalData.baseHeight;
      const { riseRateMps, totalRiseM } = computeEntityDynamics(entity, rainMm, durationHours);

      console.log(
        `[SIM] ${entity.historicalData.kecamatan}: base=${baseHeight.toFixed(2)}m,` +
        ` RRISE=${(entity.historicalData.riseRate || 0).toFixed(4)} cm/s,` +
        ` rate=${riseRateMps.toFixed(4)} m/s, totalRise=${totalRiseM.toFixed(2)} m`
      );
    
      // Absolute mode (dasar tetap di baseHeight)
      entity.polygon.heightReference = Cesium.HeightReference.NONE;
      entity.polygon.extrudedHeightReference = Cesium.HeightReference.NONE;
      entity.polygon.extrudedHeight = baseHeight;
    
      const depthGetter = (time) => {
        if (!isAnimatingWater || !waterAnimationStartTime) return 0;
        const elapsed = Cesium.JulianDate.secondsDifference(time, waterAnimationStartTime);
        return Math.min(Math.max(elapsed * riseRateMps, 0), totalRiseM);
      };
    
      entity.polygon.height = new Cesium.CallbackProperty(
        (time) => baseHeight + depthGetter(time), false
      );
    
      entity.polygon.material = createDepthColorMaterial(depthGetter);
    });

    viewer.clock.shouldAnimate = true;

    // Logging
    console.log(`🌊 Simulasi dimulai — durasi ${durationHours} jam, hujan ${rainMm} mm. Kenaikan & warna per-kecamatan mengikuti RRISE masing-masing.`);

  } catch (error) {
    console.error('Error dalam simulasi banjir:', error.message);
    throw error;
  }
}

/**
 * Menghentikan simulasi banjir dan mereset ketinggian air
 * @param {Cesium.Viewer} viewer - Cesium viewer
 */
export function stopFloodSimulation(viewer) {
  isAnimatingWater = false;
  waterAnimationStartTime = null;
  rainEventStartJulianDate = null;
  rainEventEndJulianDate = null;
  removeRainEffect(viewer.scene);

  // Reset clock ke real-time
  const now = Cesium.JulianDate.now();
  viewer.clock.startTime = now.clone();
  viewer.clock.currentTime = now.clone();
  viewer.clock.stopTime = Cesium.JulianDate.addDays(now, 1, new Cesium.JulianDate());
  viewer.clock.multiplier = 1.0;
  viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;

  // Panggil fungsi reset dari dataLoader
  resetWaterLevelToStatic();

  console.log("Simulasi banjir dihentikan dan air direset.");
}