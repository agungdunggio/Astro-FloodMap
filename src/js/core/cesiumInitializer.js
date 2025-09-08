// src/js/core/cesiumInitializer.js
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { formatJulianDateToWITA, formatJulianTimeToWITA, formatJulianDateToShortWITAForTimeline } from '../Cesium/formatToWita.js';

import { createViewer } from '../viewerSetup.js';
import { loadWaterLevelGeoJson, loadAdminBoundaryGeoJson, addLabels } from '../dataLoader.js';
import { initializeSimulationClockEvents } from '../simulationManager.js';
import { initializeUIControls } from '../uiControl/uiControls.js';
import { initializePetaDasarPageUI } from '../uiControl/petaDasarUiControls.js';

import { PAGE_CONFIGS, LAYER_LOADERS } from '../config/pageConfigs.js';

/**
 * Konfigurasi timeline dan animation dengan format WITA
 * @param {Cesium.Viewer} viewer 
 */
function configureTimeFormatting(viewer) {
  if (viewer.animation) {
    viewer.animation.viewModel.dateFormatter = formatJulianDateToWITA;
    viewer.animation.viewModel.timeFormatter = formatJulianTimeToWITA;
  }
  
  if (viewer.timeline) {
    viewer.timeline.makeLabel = formatJulianDateToShortWITAForTimeline;
    viewer.timeline.resize();
  }
}

/**
 * Load data layers berdasarkan konfigurasi
 * @param {Cesium.Viewer} viewer 
 * @param {Array} dataLayers 
 */
async function loadDataLayers(viewer, dataLayers) {
  const loaderFunctions = {
    loadWaterLevelGeoJson,
    loadAdminBoundaryGeoJson
  };

  for (const layer of dataLayers) {
    const loaderName = LAYER_LOADERS[layer.type];
    const loaderFunction = loaderFunctions[loaderName];
    
    if (loaderFunction) {
      try {
        await loaderFunction(viewer, layer.path);
      } catch (error) {
        console.error(`Gagal memuat layer ${layer.type} dari ${layer.path}:`, error);
      }
    } else {
      console.warn(`Loader tidak ditemukan untuk tipe layer: ${layer.type}`);
    }
  }
}

/**
 * Inisialisasi fitur-fitur berdasarkan konfigurasi
 * @param {Cesium.Viewer} viewer 
 * @param {Object} features 
 */
function initializeFeatures(viewer, features) {
  if (features.labels) {
    addLabels(viewer);
  }

  if (features.clockEvents) {
    initializeSimulationClockEvents(viewer);
  }

  if (features.uiControls) {
    initializeUIControls(viewer);
  }

  if (features.petaDasarUI) {
    initializePetaDasarPageUI();
  }

  if (features.lstmPrediction) {
    // initializeLSTMPrediction(viewer); // TODO: Implement this
    console.log('🧠 LSTM Prediction feature akan diaktifkan');
  }

  if (features.charts) {
    // initializeCharts(viewer); // TODO: Implement this  
    console.log('📊 Charts feature akan diaktifkan');
  }
}

/**
 * Universal Cesium initializer
 * @param {string} pageType - Tipe halaman dari PAGE_CONFIGS
 * @returns {Promise<Cesium.Viewer|null>}
 */
export async function initializeCesiumPage(pageType) {
  const config = PAGE_CONFIGS[pageType];
  
  if (!config) {
    console.error(`Konfigurasi tidak ditemukan untuk tipe halaman: ${pageType}`);
    return null;
  }

  try {
    // 1. Buat viewer
    const viewer = await createViewer();
    
    if (!viewer) {
      throw new Error('Gagal membuat Cesium Viewer');
    }

    // 2. Load data layers
    await loadDataLayers(viewer, config.dataLayers);

    // 3. Konfigurasi time formatting
    configureTimeFormatting(viewer);

    // 4. Inisialisasi fitur-fitur
    initializeFeatures(viewer, config.features);

    // 5. Log success message
    console.log(config.logMessage);

    return viewer;

  } catch (error) {
    console.error(`Gagal menginisialisasi halaman ${config.name}:`, error);
    return null;
  }
}

/**
 * Shorthand functions untuk backward compatibility dan kemudahan penggunaan
 */
export async function initializeCesiumApp() {
  return await initializeCesiumPage('SIMULATION');
}

export async function initializeBaseMap() {
  return await initializeCesiumPage('BASE_MAP');
}

export async function initializeLSTMPage() {
    return await initializeCesiumPage('LSTM_PREDICTION');
}