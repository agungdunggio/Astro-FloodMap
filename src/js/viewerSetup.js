// Cesium dimuat dari CDN, akses via window.Cesium
import { cesiumAccessToken, getTargetLocation, cesiumTerrainAssetId } from "./cesiumConfig.js";

// Helper untuk mendapatkan Cesium
const getCesium = () => window.Cesium;

export async function createViewer() {
  const Cesium = getCesium();
  
  if (!cesiumAccessToken) {
    console.warn("PERHATIAN: Cesium Ion Access Token belum diatur di cesiumConfig.js. Beberapa fitur mungkin tidak berfungsi.");
  }
  Cesium.Ion.defaultAccessToken = cesiumAccessToken;

  const viewer = new Cesium.Viewer("cesiumContainer", {
    shouldAnimate: true,
    terrain: Cesium.Terrain.fromWorldTerrain({ requestWaterMask: true }),
    timeline: true,
    animation: true,
    geocoder: false,
    homeButton: true,
    sceneModePicker: false,
  });

  const scene = viewer.scene;
  scene.globe.depthTestAgainstTerrain = true;
  scene.camera.setView(getTargetLocation(Cesium));
  scene.verticalExaggeration = 1;

  // Custom home button behavior - navigasi ke halaman utama
  viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
    e.cancel = true;
    window.location.href = '/#technologies';
  });

  try {
    if (!cesiumAccessToken) {
      throw new Error("Cesium Ion Access Token is missing. Cannot load terrain.");
    }
    viewer.scene.setTerrain(
      new Cesium.Terrain(
        Cesium.CesiumTerrainProvider.fromIonAssetId(cesiumTerrainAssetId),
      ),
    );
  } catch (error) {
    console.error("Gagal memuat terrain Cesium Ion:", error);
  }
  
  return viewer;
}