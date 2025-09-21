// src/js/simulationManager.js
import * as Cesium from 'cesium';
// Impor fungsi efek hujan dan state partikelnya jika perlu dicek di sini
import { addRainEffect, removeRainEffect, currentRainParticleSystem as rainSystemFromEffectModule } from './rainEffect.js';

// State internal modul ini untuk interval event hujan
let rainEventStartJulianDate = null;
let rainEventEndJulianDate = null;

// Variabel untuk animasi air banjir
let isAnimatingWater = false;
let waterAnimationStartTime = null;
let waterAnimationStartHeight = 29; // Ketinggian awal air
let waterAnimationEndHeight = 29;   // Ketinggian akhir air
let waterAnimationRiseRate = 0;     // Laju kenaikan (meter per detik)
let waterAnimationDurationSeconds = 0;

export function initializeSimulationClockEvents(viewer) {
  viewer.clock.onTick.addEventListener(function(clock) {
    // Logika untuk efek hujan berdasarkan interval
    if (rainEventStartJulianDate && rainEventEndJulianDate) {
      const currentTime = clock.currentTime;
      const isCurrentlyInInterval = Cesium.JulianDate.greaterThanOrEquals(currentTime, rainEventStartJulianDate) &&
                                    Cesium.JulianDate.lessThan(currentTime, rainEventEndJulianDate);

      if (isCurrentlyInInterval) {
        if (!rainSystemFromEffectModule) { // Cek apakah sistem partikel dari modul rainEffect aktif
            addRainEffect(viewer.scene);
        }
      } else {
        if (rainSystemFromEffectModule) {
            removeRainEffect(viewer.scene);
        }
      }
    } else {
      if (rainSystemFromEffectModule) {
          removeRainEffect(viewer.scene);
      }
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

// Import waterLevelEntities, startHeight, dan fungsi data dari dataLoader
import { waterLevelEntities, startHeight, resetWaterLevelToStatic, getHistoricalData, getAvailableKecamatan } from './dataLoader.js';

// Re-export fungsi dari dataLoader untuk kemudahan akses
export { getAvailableKecamatan };

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

/**
 * Memulai simulasi banjir dengan animasi kenaikan air
 * @param {Cesium.Viewer} viewer - Cesium viewer
 * @param {number} rainMm - Curah hujan dalam mm
 * @param {number} durationHours - Durasi simulasi dalam jam
 * @param {string} kecamatanName - Nama kecamatan (opsional)
 * @param {Object} options - Opsi performa (opsional)
 */
export function startFloodSimulation(viewer, rainMm, durationHours, kecamatanName = null, options = {}) {
  // Opsi performa default
  const performanceOptions = {
    enableRainEffect: true,
    enableDetailedLogging: false,
    clockMultiplier: 60,
    ...options
  };
  try {
    // Hitung kenaikan air menggunakan rumus baru
    const calculation = calculateFloodRise(rainMm, durationHours, kecamatanName);
    
    // Set variabel animasi - mulai dari ground level (0 meter)
    waterAnimationStartHeight = 0; // Mulai dari ground level
    waterAnimationEndHeight = waterAnimationStartHeight + calculation.totalRise;
    waterAnimationDurationSeconds = durationHours * 3600;
    waterAnimationRiseRate = calculation.newRiseRate;

  // Atur jam viewer mulai dari sekarang
  const now = Cesium.JulianDate.now();
  viewer.clock.startTime = now.clone();
  viewer.clock.currentTime = now.clone();
  viewer.clock.stopTime = Cesium.JulianDate.addSeconds(
    now,
    waterAnimationDurationSeconds,
    new Cesium.JulianDate()
  );
    viewer.clock.multiplier = performanceOptions.clockMultiplier; // percepat simulasi
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;

  // Set waktu mulai animasi dan flag
  waterAnimationStartTime = now.clone();
  isAnimatingWater = true;

  // PENTING: Sinkronkan waktu hujan dengan waktu simulasi yang baru
  rainEventStartJulianDate = Cesium.JulianDate.clone(now);
  rainEventEndJulianDate = Cesium.JulianDate.addHours(rainEventStartJulianDate, durationHours, new Cesium.JulianDate());
  
  // Mulai efek hujan jika diaktifkan
  if (performanceOptions.enableRainEffect) {
    removeRainEffect(viewer.scene); // Bersihkan efek lama dulu
    addRainEffect(viewer.scene);    // Mulai efek hujan baru
  }

  // Optimasi: Pasang CallbackProperty dengan caching untuk performa yang lebih baik
  const cachedHeight = { value: 0 }; // Mulai dari ground level
  
  waterLevelEntities.forEach(entity => {
    if (entity.polygon) {
      entity.polygon.extrudedHeight = new Cesium.CallbackProperty(function (time) {
        if (!isAnimatingWater || !waterAnimationStartTime) {
          return 0; // Kembali ke ground level jika tidak animasi
        }
        
        const elapsedSec = Cesium.JulianDate.secondsDifference(time, waterAnimationStartTime);
        let h = waterAnimationStartHeight + elapsedSec * waterAnimationRiseRate;
        
        // Batasi tinggi maksimum dan minimum
        if (h > waterAnimationEndHeight) h = waterAnimationEndHeight;
        if (h < 0) h = 0; // Tidak boleh di bawah ground level
        
        // Cache nilai untuk menghindari perhitungan berulang
        cachedHeight.value = h;
        return h;
      }, false);
    }
  });

  viewer.clock.shouldAnimate = true;
  
  // Logging detail hanya jika diaktifkan
  if (performanceOptions.enableDetailedLogging) {
    console.log('=== SIMULASI BANJIR - PERHITUNGAN BARU ===');
    console.log(`Kecamatan: ${calculation.historicalData.kecamatan}`);
    console.log(`Data Historis: H=${calculation.historicalData.height}cm, RRISE=${calculation.historicalData.riseRate}cm/s, P=${calculation.historicalData.precipitation}mm, D=${calculation.historicalData.duration}jam`);
    console.log(`Input User: P_baru=${rainMm}mm, D_baru=${durationHours}jam`);
    console.log(`RiseRate historis: ${calculation.historicalRiseRate.toFixed(6)} cm/s`);
    console.log(`Faktor curah hujan (f): ${calculation.precipitationFactor.toFixed(3)}`);
    console.log(`RiseRate baru: ${(calculation.newRiseRate * 100).toFixed(6)} cm/s (${calculation.newRiseRate.toFixed(6)} m/s)`);
    console.log(`Total kenaikan: ${calculation.totalRise.toFixed(2)}m`);
    console.log(`Ketinggian akhir: ${waterAnimationEndHeight.toFixed(2)}m`);
    console.log('==========================================');
  } else {
    // Logging ringkas untuk performa
    console.log(`🌊 Simulasi dimulai: ${calculation.historicalData.kecamatan}, Kenaikan: ${calculation.totalRise.toFixed(2)}m`);
  }
    
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
  
  // Reset waktu hujan
  rainEventStartJulianDate = null;
  rainEventEndJulianDate = null;
  
  // Hentikan efek hujan
  removeRainEffect(viewer.scene);
  
  // Reset clock ke waktu real-time
  const now = Cesium.JulianDate.now();
  viewer.clock.startTime = now.clone();
  viewer.clock.currentTime = now.clone();
  viewer.clock.stopTime = Cesium.JulianDate.addDays(now, 1, new Cesium.JulianDate());
  viewer.clock.multiplier = 1.0; // kembali ke kecepatan normal
  viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;
  
  // Reset ketinggian air ke nilai awal menggunakan fungsi dari dataLoader
  resetWaterLevelToStatic();
  
  console.log("Simulasi banjir dihentikan dan air direset ke ketinggian awal.");
}

// Fungsi animasi air sudah diimplementasikan di atas dengan startFloodSimulation() dan stopFloodSimulation()