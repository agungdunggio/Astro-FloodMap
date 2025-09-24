// src/js/simulationManager.js
import * as Cesium from 'cesium';
import { waterLevelEntities, resetWaterLevelToStatic, getHistoricalData, getAvailableKecamatan } from './dataLoader.js';
import { getCurrentPrecipitationMap, getForecastIntervalsMap } from './forecast/rainForecastScheduler.js';
import { addRainEffect, removeRainEffect, removeRainEffectForKecamatan, currentRainParticleSystem as rainSystemFromEffectModule } from './rainEffect.js';
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
    // Perluas rentang timeline hingga 3 hari ke depan agar bisa di-scrub panjang
    const threeDaysSeconds = 3 * 24 * 3600;
    viewer.clock.stopTime = Cesium.JulianDate.addSeconds(now, threeDaysSeconds, new Cesium.JulianDate());
    viewer.clock.multiplier = performanceOptions.clockMultiplier;
    // UNBOUNDED agar timeline bisa di-geser bebas (seperti sebelumnya)
    viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;

    waterAnimationStartTime = now.clone();
    isAnimatingWater = true;

    // Sinkronkan waktu hujan dengan simulasi
    rainEventStartJulianDate = now.clone();
    rainEventEndJulianDate = Cesium.JulianDate.addHours(rainEventStartJulianDate, durationHours, new Cesium.JulianDate());

    if (performanceOptions.enableRainEffect) {
      removeRainEffect(viewer.scene);
      addRainEffect(viewer.scene);
    }

    // Ambil curah hujan aktif per kecamatan dari scheduler (jika ada)
    const currentPrecMap = getCurrentPrecipitationMap(viewer);

    // Terapkan animasi ke setiap entitas
    waterLevelEntities.forEach(entity => {
      if (!entity?.polygon || !entity.historicalData) return;
    
      const baseHeight = entity.historicalData.baseHeight;
      // Tentukan curah hujan untuk entity ini: pakai dari scheduler jika >0, else fallback ke rainMm argumen
      const name = entity.historicalData.kecamatan;
      const mmFromScheduler = currentPrecMap.get(name) || 0;
      const effectiveRainMm = (mmFromScheduler && mmFromScheduler > 0) ? mmFromScheduler : rainMm;

      const { riseRateMps, totalRiseM } = computeEntityDynamics(entity, effectiveRainMm, durationHours);

      console.log(
        `[SIM] ${entity.historicalData.kecamatan}: base=${baseHeight.toFixed(2)}m,` +
        ` rain=${effectiveRainMm} mm,` +
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

    // Mulai dalam keadaan pause agar mudah di-scrub; user bisa tekan Play sendiri
    viewer.clock.shouldAnimate = false;

    // Zoom timeline agar menampilkan rentang penuh 3 hari
    if (viewer.timeline) {
      viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime);
    }

    // Logging
    console.log(`🌊 Simulasi dimulai — durasi ${durationHours} jam, hujan ${rainMm} mm. Kenaikan & warna per-kecamatan mengikuti RRISE masing-masing.`);

  } catch (error) {
    console.error('Error dalam simulasi banjir:', error.message);
    throw error;
  }
}

/**
 * Simulasi banjir per-kecamatan menggunakan curah hujan dari scheduler (BMKG)
 * @param {Cesium.Viewer} viewer - Cesium viewer
 * @param {number} durationHours - Durasi (jam), default 3 jam
 * @param {Object} options - Opsi performa (opsional)
 */
export function startFloodSimulationPerKecamatan(viewer, durationHours = 3, options = {}) {
  const performanceOptions = {
    enableRainEffect: false,
    enableDetailedLogging: false,
    clockMultiplier: 60,
    ...options
  };

  try {
    // Jangan ubah rentang timeline agar tetap bisa melihat beberapa hari.
    // Gunakan waktu clock saat ini sebagai acuan start animasi.
    const now = viewer.clock.currentTime.clone();
    viewer.clock.multiplier = performanceOptions.clockMultiplier;
    viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;

    waterAnimationStartTime = now.clone();
    isAnimatingWater = true;

    // Ambil curah hujan aktif per kecamatan dari scheduler
    const currentPrecMap = getCurrentPrecipitationMap(viewer);

    // Terapkan animasi ke setiap entitas berdasarkan mm masing-masing
    waterLevelEntities.forEach(entity => {
      if (!entity?.polygon || !entity.historicalData) return;

      const baseHeight = entity.historicalData.baseHeight;
      const name = entity.historicalData.kecamatan;
      const effectiveRainMm = currentPrecMap.get(name) || 0;

      if (effectiveRainMm <= 0) {
        // Tidak ada hujan untuk kecamatan ini saat ini; biarkan tetap di base height
        entity.polygon.heightReference = Cesium.HeightReference.NONE;
        entity.polygon.extrudedHeightReference = Cesium.HeightReference.NONE;
        entity.polygon.height = baseHeight;
        entity.polygon.extrudedHeight = baseHeight;
        return;
      }

      const { riseRateMps, totalRiseM } = computeEntityDynamics(entity, effectiveRainMm, durationHours);

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

      if (performanceOptions.enableDetailedLogging) {
        console.log(`[SIM-PER-KEC] ${name}: rain=${effectiveRainMm} mm, rate=${riseRateMps.toFixed(4)} m/s, total=${totalRiseM.toFixed(2)} m`);
      }
    });

    viewer.clock.shouldAnimate = true;
    console.log(`🌊 Simulasi per-kecamatan dimulai — durasi ${durationHours} jam, curah hujan dari scheduler BMKG.`);

  } catch (error) {
    console.error('Error startFloodSimulationPerKecamatan:', error.message);
    throw error;
  }
}

/**
 * Menjalankan simulasi banjir terjadwal per-kecamatan mengikuti interval prakiraan (mm > 0)
 * - Tidak mengubah rentang timeline; hanya memasang CallbackProperty saat interval aktif
 * - Setiap kecamatan berjalan 3 jam (default) sejak waktu interval aktif
 * - Hanya kecamatan yang hujan yang disimulasikan
 * @returns disposer function untuk melepas listener
 */
export function enableScheduledPerKecamatanFlood(viewer, durationHours = 3) {
  const intervalsMap = getForecastIntervalsMap();
  if (!intervalsMap || intervalsMap.size === 0) return () => {};

  const activeByName = new Map(); // name -> { start: JulianDate, end: JulianDate, baseHeight, riseRateMps, totalRiseM }
  const loggedStartByName = new Map(); // name -> last start logged

  const onTick = function(clock) {
    const nowDate = Cesium.JulianDate.toDate(clock.currentTime);

    waterLevelEntities.forEach(entity => {
      if (!entity?.historicalData) return;
      const name = entity.historicalData.kecamatan;
      const baseHeight = entity.historicalData.baseHeight;
      const intervals = intervalsMap.get(name);
      if (!intervals || intervals.length === 0) return;

      // Cari interval aktif (mm > 0) dan blok beruntun berikutnya yang juga > 0
      let activeIndex = -1;
      for (let i = 0; i < intervals.length; i++) {
        const iv = intervals[i];
        if (iv.precipitation > 0 && nowDate >= iv.start && nowDate < iv.end) {
          activeIndex = i;
          break;
        }
      }

      let maxMm = 0;
      let blockStart = null;
      let blockEnd = null;
      if (activeIndex >= 0) {
        blockStart = new Date(Math.max(nowDate.getTime(), intervals[activeIndex].start.getTime()));
        // kumpulkan semua interval beruntun >0 dimulai dari activeIndex
        let localMax = 0;
        blockEnd = intervals[activeIndex].end;
        for (let j = activeIndex; j < intervals.length; j++) {
          const ivj = intervals[j];
          if (ivj.precipitation > 0) {
            const v = Number(ivj.precipitation || 0);
            if (v > localMax) localMax = v;
            blockEnd = ivj.end;
          } else {
            break;
          }
        }
        maxMm = localMax;
      }

      const active = activeByName.get(name);

      if (maxMm > 0) {
        // Start jika belum aktif
        if (!active || Cesium.JulianDate.greaterThan(clock.currentTime, active.end)) {
          const start = clock.currentTime.clone();
          // durasi dinamis: gunakan panjang blok hujan beruntun (jam)
          const dynamicHours = blockStart && blockEnd ? Math.max((blockEnd - blockStart) / 3600000, durationHours) : durationHours;
          const end = Cesium.JulianDate.addHours(start, dynamicHours, new Cesium.JulianDate());
          const { riseRateMps, totalRiseM } = computeEntityDynamics(entity, maxMm, dynamicHours);

          entity.polygon.heightReference = Cesium.HeightReference.NONE;
          entity.polygon.extrudedHeightReference = Cesium.HeightReference.NONE;
          entity.polygon.extrudedHeight = baseHeight;

          const depthGetter = (time) => {
            const elapsed = Cesium.JulianDate.secondsDifference(time, start);
            return Math.min(Math.max(elapsed * riseRateMps, 0), totalRiseM);
          };

          entity.polygon.height = new Cesium.CallbackProperty(
            (time) => baseHeight + depthGetter(time), false
          );
          entity.polygon.material = createDepthColorMaterial(depthGetter);

          activeByName.set(name, { start, end, baseHeight, riseRateMps, totalRiseM });

          // Logging ke console & kirim ke UI tabel log (hindari duplikat untuk event yang sama)
          try {
            const riseM = totalRiseM;
            const riseCm = riseM * 100;
            const hBaru = baseHeight + riseM;
            const durasiJam = (blockStart && blockEnd) ? ((blockEnd - blockStart) / 3600000) : dynamicHours;
            const startDate = Cesium.JulianDate.toDate(start);
            const lastLoggedIso = loggedStartByName.get(name);
            const thisIso = startDate.toISOString();
            if (lastLoggedIso !== thisIso) {
              window.dispatchEvent(new CustomEvent('floodStartLog', {
                detail: {
                  timestampIso: thisIso,
                  name,
                  maxMm,
                  baseHeight,
                  riseM,
                  riseCm,
                  hBaru,
                  durationHours: durasiJam
                }
              }));
              loggedStartByName.set(name, thisIso);
            }
          } catch(_) { /* noop */ }
        }
      } else if (active) {
        // Tidak ada hujan sekarang; jika masih aktif dan sudah lewat end, reset
        if (Cesium.JulianDate.greaterThanOrEquals(clock.currentTime, active.end)) {
          entity.polygon.height = active.baseHeight;
          entity.polygon.extrudedHeight = active.baseHeight;
          activeByName.delete(name);
        }
      }
    });
  };

  viewer.clock.onTick.addEventListener(onTick);
  return () => viewer.clock.onTick.removeEventListener(onTick);
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

/**
 * Jadwalkan simulasi global berbasis prediksi LSTM harian.
 * - predictions: Array<{ date: 'YYYY-MM-DD', value: number }>
 * - Setiap hari, mulai pukul 12:00 (local) selama 6 jam (default)
 * - Menjalankan startFloodSimulation(viewer, mm, durationHours)
 * Mengembalikan disposer untuk melepas listener.
 */
export function enableScheduledLSTMFlood(viewer, predictions = [], durationHours = 6) {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return () => {};
  }

  // Precompute schedule windows in local time
  const windows = predictions.map(p => {
    const d = new Date(p.date + 'T12:00:00');
    const start = Cesium.JulianDate.fromDate(d);
    const end = Cesium.JulianDate.addHours(start, durationHours, new Cesium.JulianDate());
    return { start, end, mm: Number(p.value || 0), key: p.date };
  });

  const activeByName = new Map(); // key -> { start: JulianDate, end: JulianDate, baseHeight, riseRateMps, totalRiseM }
  const loggedStartByName = new Map(); // key -> last start logged

  const onTick = function(clock) {
    const now = clock.currentTime;
    
    // Cek apakah ada window yang aktif sekarang
    let currentWindow = null;
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const inWindow = Cesium.JulianDate.greaterThanOrEquals(now, w.start) && Cesium.JulianDate.lessThan(now, w.end);
      if (inWindow && w.mm > 0) {
        currentWindow = w;
        break;
      }
    }

    if (currentWindow) {
      const active = activeByName.get(currentWindow.key);
      
      // Start jika belum aktif atau sudah lewat dari window sebelumnya
      if (!active || Cesium.JulianDate.greaterThan(now, active.end)) {
        const start = now.clone();
        const end = Cesium.JulianDate.addHours(start, durationHours, new Cesium.JulianDate());
        
        // Gunakan entity pertama sebagai referensi untuk perhitungan global
        const referenceEntity = waterLevelEntities[0];
        if (!referenceEntity?.historicalData) return;
        
        const baseHeight = referenceEntity.historicalData.baseHeight;
        const { riseRateMps, totalRiseM } = computeEntityDynamics(referenceEntity, currentWindow.mm, durationHours);

        // Terapkan ke semua entities (global simulation)
        waterLevelEntities.forEach(entity => {
          if (!entity?.polygon || !entity.historicalData) return;
          
          const entityBaseHeight = entity.historicalData.baseHeight;
          
          entity.polygon.heightReference = Cesium.HeightReference.NONE;
          entity.polygon.extrudedHeightReference = Cesium.HeightReference.NONE;
          entity.polygon.extrudedHeight = entityBaseHeight;

          const depthGetter = (time) => {
            const elapsed = Cesium.JulianDate.secondsDifference(time, start);
            return Math.min(Math.max(elapsed * riseRateMps, 0), totalRiseM);
          };

          entity.polygon.height = new Cesium.CallbackProperty(
            (time) => entityBaseHeight + depthGetter(time), false
          );
          entity.polygon.material = createDepthColorMaterial(depthGetter);
        });

        // Set interval hujan untuk clock events
        rainEventStartJulianDate = start.clone();
        rainEventEndJulianDate = end.clone();
        
        // Aktifkan efek hujan global (hentikan hujan per-kecamatan dulu)
        removeRainEffectForKecamatan(viewer.scene);
        removeRainEffect(viewer.scene);
        // Delay sedikit untuk memastikan remove selesai
        setTimeout(() => {
          addRainEffect(viewer.scene);
        }, 100);

        activeByName.set(currentWindow.key, { start, end, baseHeight, riseRateMps, totalRiseM });

        // Logging ke console & kirim ke UI tabel log (hindari duplikat untuk event yang sama)
        try {
          const riseM = totalRiseM;
          const riseCm = riseM * 100;
          const hBaru = baseHeight + riseM;
          const startDate = Cesium.JulianDate.toDate(start);
          const lastLoggedIso = loggedStartByName.get(currentWindow.key);
          const thisIso = startDate.toISOString();
          
          if (lastLoggedIso !== thisIso) {
            console.log(
              `[START FLOOD LSTM] Date: ${currentWindow.key} | maxMm=${currentWindow.mm.toFixed(2)} | baseHeight=${baseHeight.toFixed(2)} m | ` +
              `rate=${riseRateMps.toFixed(5)} m/s | riseM=${riseM.toFixed(5)} m | riseCm=${riseCm.toFixed(2)} cm | ` +
              `HBaru=${hBaru.toFixed(5)} m | durasi=${durationHours} jam | jam=${startDate.toLocaleString('id-ID')}`
            );

            window.dispatchEvent(new CustomEvent('floodStartLog', {
              detail: {
                timestampIso: thisIso,
                name: 'GLOBAL (LSTM)',
                maxMm: currentWindow.mm,
                baseHeight,
                riseM,
                riseCm,
                hBaru,
                durationHours
              }
            }));
            loggedStartByName.set(currentWindow.key, thisIso);
          }
        } catch(_) { /* noop */ }
      }
    } else {
      // Tidak ada window aktif; reset semua yang sudah lewat
      for (const [key, active] of activeByName.entries()) {
        if (Cesium.JulianDate.greaterThanOrEquals(now, active.end)) {
          // Reset semua entities ke base height
          waterLevelEntities.forEach(entity => {
            if (entity?.polygon && entity.historicalData) {
              entity.polygon.height = entity.historicalData.baseHeight;
              entity.polygon.extrudedHeight = entity.historicalData.baseHeight;
            }
          });
          
          // Reset interval hujan
          rainEventStartJulianDate = null;
          rainEventEndJulianDate = null;
          
          // Hentikan efek hujan
          removeRainEffect(viewer.scene);
          removeRainEffectForKecamatan(viewer.scene);
          
          activeByName.delete(key);
          loggedStartByName.delete(key);
          console.log(`[LSTM] Menghentikan simulasi global untuk ${key}.`);
        }
      }
    }
  };

  viewer.clock.onTick.addEventListener(onTick);
  return () => {
    viewer.clock.onTick.removeEventListener(onTick);
    
    // Reset semua entities ke base height
    waterLevelEntities.forEach(entity => {
      if (entity?.polygon && entity.historicalData) {
        entity.polygon.height = entity.historicalData.baseHeight;
        entity.polygon.extrudedHeight = entity.historicalData.baseHeight;
      }
    });
    
    // Reset interval hujan
    rainEventStartJulianDate = null;
    rainEventEndJulianDate = null;
    
    // Hentikan efek hujan
    removeRainEffect(viewer.scene);
    removeRainEffectForKecamatan(viewer.scene);
    
    activeByName.clear();
    loggedStartByName.clear();
    console.log("Scheduled LSTM flood simulation stopped.");
  };
}