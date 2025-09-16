import * as Cesium from 'cesium'; 
  
const cesiumAccessToken = import.meta.env.PUBLIC_CESIUM_ACCESS_TOKEN;

const cesiumTerrainAssetId = import.meta.env.PUBLIC_CESIUM_TERRAIN_ASSET_ID;

const targetLocation = {
  destination: Cesium.Cartesian3.fromDegrees(/*123.064198*/ 123.064086, /*0.522333*/ 0.483838, 1000), // Koordinat Jakarta
  orientation: {
    heading: Cesium.Math.toRadians(0.0),
    pitch: Cesium.Math.toRadians(-15.0),
  },
};
export { cesiumAccessToken, targetLocation, cesiumTerrainAssetId };
