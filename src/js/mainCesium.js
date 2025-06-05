// src/js/mainCesium.js
import * as Cesium from 'cesium';
// Jika TIDAK menggunakan vite-plugin-cesium, atau plugin tidak handle CSS:
import 'cesium/Build/Cesium/Widgets/widgets.css';
import {formatJulianDateToWITA, formatJulianTimeToWITA, formatJulianDateToShortWITAForTimeline} from './Cesium/formatToWita.js';
// Jika TIDAK menggunakan vite-plugin-cesium dan aset di public/cesium-assets:
// globalThis.CESIUM_BASE_URL = '/cesium-assets/';

import { createViewer } from './viewerSetup.js';
import { loadWaterLevelGeoJson, loadAdminBoundaryGeoJson, addLabels } from './dataLoader.js';
import { initializeSimulationClockEvents } from './simulationManager.js';
import { initializeUIControls /*, uiResetWaterLevel */ } from './uiControl/uiControls.js'; // Impor jika perlu


export async function initializeCesiumApp() {
    const viewer = await createViewer();

    if (viewer) {
        // Path ke data GeoJSON (relatif dari folder /public)
        await loadWaterLevelGeoJson(viewer, "/data/geojson/water/waterLevel.json");
        await loadAdminBoundaryGeoJson(viewer, "/data/geojson/administrasi/lineAdmnKec.json");
        await loadAdminBoundaryGeoJson(viewer, "/data/geojson/administrasi/areaKotaAdministrasiKotaGtlo.json");
        
        addLabels(viewer);
        initializeSimulationClockEvents(viewer);
        initializeUIControls(viewer);

        if (viewer.animation) {
          viewer.animation.viewModel.dateFormatter = formatJulianDateToWITA;
          viewer.animation.viewModel.timeFormatter = formatJulianTimeToWITA;
        }
        
        if (viewer.timeline) {
          viewer.timeline.makeLabel = formatJulianDateToShortWITAForTimeline;
          viewer.timeline.resize();
        }
        
        // Panggil reset di awal jika Anda ingin air mulai dari startHeight (29m)
        // uiResetWaterLevel(); // Atau pastikan loadWaterLevelGeoJson mengatur ketinggian awal yang benar

        console.log("Aplikasi CesiumJS di Astro berhasil diinisialisasi.");
    } else {
        console.error("Gagal membuat Cesium Viewer di Astro.");
    }
}

export async function initializeBaseMap() {
    const viewer = await createViewer();
  
    if (viewer) {
      await loadWaterLevelGeoJson(viewer, "/data/geojson/water/waterLevel.json");
      await loadAdminBoundaryGeoJson(viewer, "/data/geojson/administrasi/lineAdmnKec.json");
      await loadAdminBoundaryGeoJson(viewer, "/data/geojson/administrasi/areaKotaAdministrasiKotaGtlo.json");

      if (viewer.animation) {
        viewer.animation.viewModel.dateFormatter = function(date, viewModel) {
          return formatJulianDateToWITA(date);
        };
      }
    
      if (viewer.timeline) {
        viewer.timeline.makeLabel = function(date) {
          return formatJulianDateToShortWITAForTimeline(date);
        };
        viewer.timeline.resize();
      }
    
      
      addLabels(viewer);
  
      console.log("Peta Dasar CesiumJS berhasil diinisialisasi.");
    } else {
      console.error("Gagal membuat Cesium Viewer untuk Peta Dasar.");
    }
  }