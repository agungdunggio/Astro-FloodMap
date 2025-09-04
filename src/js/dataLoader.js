// src/js/dataLoader.js
import * as Cesium from 'cesium';

export let waterLevelEntities = [];
export const startHeight = 29; // Ketinggian awal statis air - di-export untuk digunakan di modul lain

export async function loadWaterLevelGeoJson(viewer, geoJsonUrl) {
  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl);
    viewer.dataSources.add(dataSource);
    waterLevelEntities = dataSource.entities.values; // Update variabel global/module

    waterLevelEntities.forEach((entity) => {
      if (Cesium.defined(entity.polygon)) {
        entity.polygon.material = Cesium.Color.fromCssColorString("#00BFFF").withAlpha(0.7);
        entity.polygon.outline = true;
        entity.polygon.outlineColor = Cesium.Color.BLUE;
        entity.polygon.outlineWidth = 2;
        entity.polygon.height = 0;
        entity.polygon.extrudedHeight = startHeight;
        entity.polygon.perPositionHeight = false;
        entity.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
        entity.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
      }
    });
  } catch (error) {
    console.error("Gagal memuat Water Level GeoJSON:", error);
  }
}

export async function loadAdminBoundaryGeoJson(viewer, geoJsonUrl) {
  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, { clampToGround: true });
    viewer.dataSources.add(dataSource);
    dataSource.entities.values.forEach((entity) => {
      if (Cesium.defined(entity.polyline)) {
        entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Cesium.Color.YELLOW,
        });
        entity.polyline.width = 5;
      } else if (Cesium.defined(entity.polygon)) {
        entity.polygon.fill = false;
        entity.polygon.outline = true;
        entity.polygon.outlineColor = Cesium.Color.YELLOW;
        entity.polygon.outlineWidth = 2;
        entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
      }
    });
  } catch (error) {
    console.error("Gagal memuat Admin Boundary GeoJSON:", error);
  }
}

const labelData = [
  { lon: 123.025807, lat: 0.539135, text: "Kota Barat" },
  { lon: 123.062215, lat: 0.579999, text: "Sipatana" },
  { lon: 123.075564, lat: 0.510090, text: "Dumbo Raya" },
  { lon: 123.057450, lat: 0.545645, text: "Kota Selatan" },
  { lon: 123.055317, lat: 0.563404, text: "Kota Tengah" },
  { lon: 123.079461, lat: 0.567214, text: "Kota Utara" },
  { lon: 123.069647, lat: 0.540877, text: "Kota Timur" },
  { lon: 123.048780, lat: 0.516828, text: "Hulonthalangi" },
  { lon: 123.038144, lat: 0.564067, text: "Dungingi" },
];

const kecamatanList = [
  { nama: "Kota Selatan", position: Cesium.Cartesian3.fromDegrees(123.057450, 0.545645) },
  { nama: "Kota Tengah", position: Cesium.Cartesian3.fromDegrees(123.055317, 0.563404) },
  { nama: "Kota Utara", position: Cesium.Cartesian3.fromDegrees(123.079461, 0.567214) },
  { nama: "Kota Timur", position: Cesium.Cartesian3.fromDegrees(123.069647, 0.540877) },
  { nama: "Hulonthalangi", position: Cesium.Cartesian3.fromDegrees(123.048780, 0.516828) },
  { nama: "Dungingi", position: Cesium.Cartesian3.fromDegrees(123.038144, 0.564067) },
  { nama: "Kota Barat", position: Cesium.Cartesian3.fromDegrees(123.025807, 0.539135) },
  { nama: "Sipatana", position: Cesium.Cartesian3.fromDegrees(123.062215, 0.579999) },
  { nama: "Dumbo Raya", position: Cesium.Cartesian3.fromDegrees(123.075564, 0.510090) },
];

export function addLabels(viewer) {
  labelData.forEach((label) => {
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(label.lon, label.lat, 50),
      label: {
        text: label.text,
        font: "15pt sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  });
}

/**
 * Reset ketinggian air ke nilai awal statis
 * Menghapus CallbackProperty dan menggunakan nilai tetap
 */
export function resetWaterLevelToStatic() {
  waterLevelEntities.forEach((entity) => {
    if (Cesium.defined(entity.polygon)) {
      entity.polygon.extrudedHeight = startHeight;
      entity.polygon.material = Cesium.Color.fromCssColorString("#00BFFF").withAlpha(0.7);
    }
  });
  console.log(`Water level direset ke ketinggian statis: ${startHeight}m`);
}