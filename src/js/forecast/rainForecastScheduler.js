// src/js/forecast/rainForecastScheduler.js
import * as Cesium from 'cesium';
import { getKecamatanCentroids } from '../dataLoader.js';
import { addRainEffectForKecamatan, removeRainEffectForKecamatan } from '../rainEffect.js';

let schedulerState = {
  viewer: null,
  centroidsByName: new Map(),
  // Map<string, Array<{ start: Date, end: Date, precipitation: number }>>
  forecastsByKecamatan: new Map(),
  onTickHandler: null,
  lastActiveSetKey: '',
};

function buildActiveSetKey(activeNames) {
  return activeNames.sort().join('|');
}

export async function initRainForecastScheduler(viewer) {
  schedulerState.viewer = viewer;
  // Load centroids once
  const centroids = await getKecamatanCentroids();
  schedulerState.centroidsByName = new Map(
    centroids.map((c) => [c.name.replace('Kecamatan ', ''), c])
  );

  // Attach onTick if not exists
  if (!schedulerState.onTickHandler) {
    schedulerState.onTickHandler = function(clock) {
      if (!schedulerState.viewer || schedulerState.forecastsByKecamatan.size === 0) return;

      const currentDate = Cesium.JulianDate.toDate(clock.currentTime);

      // Determine which kecamatan should have rain now
      const active = [];
      schedulerState.forecastsByKecamatan.forEach((intervals, name) => {
        // Find any interval where currentDate in [start, end)
        for (let i = 0; i < intervals.length; i++) {
          const iv = intervals[i];
          if (iv.precipitation > 0 && currentDate >= iv.start && currentDate < iv.end) {
            active.push(name);
            break;
          }
        }
      });

      const key = buildActiveSetKey(active);
      if (key !== schedulerState.lastActiveSetKey) {
        schedulerState.lastActiveSetKey = key;
        if (active.length === 0) {
          removeRainEffectForKecamatan(schedulerState.viewer.scene);
        } else {
          const positions = active
            .map((n) => schedulerState.centroidsByName.get(n))
            .filter(Boolean);
          addRainEffectForKecamatan(schedulerState.viewer.scene, positions);
        }
      }
    };

    viewer.clock.onTick.addEventListener(schedulerState.onTickHandler);
  }
}

/**
 * Update forecast data for the scheduler using BMKG aggregated data structure
 * @param {Object} aggregatedData - { [kecamatanKey]: { namaResmi: string, forecasts: Array<{localDateTime, totalPrecipitation}> } }
 */
export function updateRainForecastData(aggregatedData) {
  if (!aggregatedData) return;
  const map = new Map();

  // Build intervals: each forecast point spans to next point's time (or +1h fallback)
  Object.entries(aggregatedData).forEach(([kecamatanKey, data]) => {
    const name = (data?.namaResmi || kecamatanKey || '').replace('Kecamatan ', '');
    const arr = Array.isArray(data?.forecasts) ? data.forecasts : [];
    const intervals = [];
    for (let i = 0; i < arr.length; i++) {
      const cur = arr[i];
      const next = arr[i + 1];
      const start = new Date(cur.localDateTime);
      const end = next ? new Date(next.localDateTime) : new Date(start.getTime() + 60 * 60 * 1000);
      const precipitation = Number(cur.totalPrecipitation || 0);
      intervals.push({ start, end, precipitation });
    }
    map.set(name, intervals);
  });

  schedulerState.forecastsByKecamatan = map;
  schedulerState.lastActiveSetKey = '';
}

export function disposeRainForecastScheduler() {
  if (schedulerState.viewer && schedulerState.onTickHandler) {
    schedulerState.viewer.clock.onTick.removeEventListener(schedulerState.onTickHandler);
  }
  schedulerState.onTickHandler = null;
  schedulerState.lastActiveSetKey = '';
  schedulerState.forecastsByKecamatan = new Map();
}

/**
 * Mendapatkan peta curah hujan (mm) aktif pada waktu clock saat ini per kecamatan.
 * @param {Cesium.Viewer} viewer
 * @returns {Map<string, number>} NamaKecamatan -> mm (0 jika tidak ada hujan)
 */
export function getCurrentPrecipitationMap(viewer) {
  const result = new Map();
  if (!viewer || schedulerState.forecastsByKecamatan.size === 0) return result;

  const now = Cesium.JulianDate.toDate(viewer.clock.currentTime);

  schedulerState.forecastsByKecamatan.forEach((intervals, name) => {
    let mm = 0;
    for (let i = 0; i < intervals.length; i++) {
      const iv = intervals[i];
      if (now >= iv.start && now < iv.end) {
        mm = Number(iv.precipitation || 0);
        break;
      }
    }
    result.set(name, mm);
  });

  return result;
}

/**
 * Ekspor salinan struktur interval prakiraan untuk dipakai scheduler simulasi banjir.
 * @returns {Map<string, Array<{ start: Date, end: Date, precipitation: number }>>}
 */
export function getForecastIntervalsMap() {
  return new Map(schedulerState.forecastsByKecamatan);
}


