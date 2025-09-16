// src/js/viewerSetup.js
import * as Cesium from 'cesium';
import { cesiumAccessToken, targetLocation, cesiumTerrainAssetId } from "./cesiumConfig.js";

export async function createViewer() {
  if (!cesiumAccessToken) {
    console.warn("PERHATIAN: Cesium Ion Access Token belum diatur di cesiumConfig.js. Beberapa fitur mungkin tidak berfungsi.");
    // Anda bisa menampilkan pesan ini di UI juga jika mau
  }
  Cesium.Ion.defaultAccessToken = cesiumAccessToken;

  const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(cesiumTerrainAssetId);

  const viewer = new Cesium.Viewer("cesiumContainer", {
    shouldAnimate: true,
    terrain: new Cesium.Terrain({
      provider: terrainProvider,
      requestWaterMask: true,
    }),
    timeline: true,
    animation: true,
    geocoder: false,
    homeButton: true,
    // baseLayerPicker: false,
    sceneModePicker: false,
    // creditContainer: document.createElement("div"),
  });

  try {
    const osmBuildingsTileset = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(osmBuildingsTileset);
  } catch (error) {
    console.error("Gagal memuat OSM Buildings:", error);
  }

  const scene = viewer.scene;
  scene.globe.depthTestAgainstTerrain = true;
  scene.camera.setView(targetLocation);
  scene.verticalExaggeration = 1; // Sesuai kode asli Anda

  // Custom home button behavior - navigasi ke halaman utama
  viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
    e.cancel = true; // Cancel default home behavior
    window.location.href = '/#technologies'; // Navigate to home page
  });
  
  return viewer;
}