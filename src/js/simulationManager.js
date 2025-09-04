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

// Import waterLevelEntities dan startHeight dari dataLoader
import { waterLevelEntities, startHeight, resetWaterLevelToStatic } from './dataLoader.js';

/**
 * Memulai simulasi banjir dengan animasi kenaikan air
 * @param {Cesium.Viewer} viewer - Cesium viewer
 * @param {number} rainMm - Curah hujan dalam mm
 * @param {number} durationHours - Durasi simulasi dalam jam
 */
export function startFloodSimulation(viewer, rainMm, durationHours) {
  // Konversi curah hujan ke kenaikan air
  const risePerMm = 0.1; // contoh: 1 mm = 0.1 m
  const totalRise = rainMm * risePerMm;
  
  // Set variabel animasi
  waterAnimationStartHeight = startHeight; // Ketinggian awal dari dataLoader
  waterAnimationEndHeight = waterAnimationStartHeight + totalRise;
  waterAnimationDurationSeconds = durationHours * 3600;
  waterAnimationRiseRate = totalRise / waterAnimationDurationSeconds;

  // Atur jam viewer mulai dari sekarang
  const now = Cesium.JulianDate.now();
  viewer.clock.startTime = now.clone();
  viewer.clock.currentTime = now.clone();
  viewer.clock.stopTime = Cesium.JulianDate.addSeconds(
    now,
    waterAnimationDurationSeconds,
    new Cesium.JulianDate()
  );
  viewer.clock.multiplier = 60; // percepat simulasi
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;

  // Set waktu mulai animasi dan flag
  waterAnimationStartTime = now.clone();
  isAnimatingWater = true;

  // PENTING: Sinkronkan waktu hujan dengan waktu simulasi yang baru
  rainEventStartJulianDate = Cesium.JulianDate.clone(now);
  rainEventEndJulianDate = Cesium.JulianDate.addHours(rainEventStartJulianDate, durationHours, new Cesium.JulianDate());
  
  // Mulai efek hujan segera karena kita sudah dalam interval waktu hujan
  removeRainEffect(viewer.scene); // Bersihkan efek lama dulu
  addRainEffect(viewer.scene);    // Mulai efek hujan baru

  // Pasang CallbackProperty untuk extrudedHeight pada semua entitas air
  waterLevelEntities.forEach(entity => {
    if (entity.polygon) {
      entity.polygon.extrudedHeight = new Cesium.CallbackProperty(function (time) {
        if (!isAnimatingWater || !waterAnimationStartTime) {
          return waterAnimationStartHeight;
        }
        
        const elapsedSec = Cesium.JulianDate.secondsDifference(time, waterAnimationStartTime);
        let h = waterAnimationStartHeight + elapsedSec * waterAnimationRiseRate;
        
        // Batasi tinggi maksimum
        if (h > waterAnimationEndHeight) h = waterAnimationEndHeight;
        if (h < waterAnimationStartHeight) h = waterAnimationStartHeight;
        
        return h;
      }, false);
    }
  });

  viewer.clock.shouldAnimate = true;
  console.log(`Simulasi banjir dimulai: ${rainMm}mm hujan, durasi ${durationHours} jam`);
  console.log(`Kenaikan air: ${totalRise.toFixed(2)}m (dari ${waterAnimationStartHeight}m ke ${waterAnimationEndHeight.toFixed(2)}m)`);
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