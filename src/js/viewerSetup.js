// src/js/viewerSetup.js
import * as Cesium from 'cesium';
import { cesiumAccessToken, targetLocation } from "./cesiumConfig.js";

export async function createViewer() {
  if (cesiumAccessToken === !cesiumAccessToken) {
    console.warn("PERHATIAN: Cesium Ion Access Token belum diatur di cesiumConfig.js. Beberapa fitur mungkin tidak berfungsi.");
    // Anda bisa menampilkan pesan ini di UI juga jika mau
  }
  Cesium.Ion.defaultAccessToken = cesiumAccessToken;

  const viewer = new Cesium.Viewer("cesiumContainer", {
    shouldAnimate: true,
    terrain: Cesium.Terrain.fromWorldTerrain({ requestWaterMask: true }),
    timeline: true,
    animation: true,
    geocoder: false,
    homeButton: false,
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

  return viewer;
}