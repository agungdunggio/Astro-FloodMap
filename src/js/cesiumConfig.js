const cesiumAccessToken = import.meta.env.PUBLIC_CESIUM_ACCESS_TOKEN;

const cesiumTerrainAssetId = import.meta.env.PUBLIC_CESIUM_TERRAIN_ASSET_ID;

// Koordinat target: Gorontalo
const TARGET_COORDS = {
  longitude: 123.064086,
  latitude: 0.483838,
  height: 1000,
  heading: 0.0,
  pitch: -15.0
};

/**
 * Get target location untuk camera view
 * @param {typeof import('cesium')} Cesium - Cesium module
 * @returns {Object} Target location object untuk camera.setView()
 */
function getTargetLocation(Cesium) {
  return {
    destination: Cesium.Cartesian3.fromDegrees(
      TARGET_COORDS.longitude,
      TARGET_COORDS.latitude,
      TARGET_COORDS.height
    ),
    orientation: {
      heading: Cesium.Math.toRadians(TARGET_COORDS.heading),
      pitch: Cesium.Math.toRadians(TARGET_COORDS.pitch),
    },
  };
}

export { cesiumAccessToken, getTargetLocation, cesiumTerrainAssetId, TARGET_COORDS };
