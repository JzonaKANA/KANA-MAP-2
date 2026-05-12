// ================================
// CESIUM ION TOKEN (STRING REQUIRED)
// ================================
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMWEzNzczYi04Y2RhLTRjYzUtOTRmOC0xNGU0OGQxZjQ2ZDAiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE1BUCIsImlhdCI6MTc3ODYxMDU3Mn0.ASj9oPhBXb9_BVenzwxw3sRGf2uYl3_zb54IlfIELYY";

// ================================
// CREATE VIEWER
// ================================
const viewer = new Cesium.Viewer("map", {
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url:
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    credit: "Esri"
  }),
  terrainProvider: Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
    requestWaterMask: true,
    requestVertexNormals: true
  }),
  baseLayerPicker: false,
  geocoder: false,
  timeline: false,
  animation: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  fullscreenButton: false,
  infoBox: false,
  selectionIndicator: false
});

// ================================
// SCENE TUNING (CRITICAL)
// ================================
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;

viewer.scene.screenSpaceCameraController.minimumZoomDistance = 500;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;

viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.00015;

viewer.resize();

// ================================
// CINEMATIC FLY-IN TO KODIAK
// ================================
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-152.8, 57.95, 140000),
  orientation: { pitch: Cesium.Math.toRadians(-55) },
  duration: 3
});

setTimeout(() => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-152.4074, 57.7909, 1500),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 2.4
  });
}, 2200);

// ================================
// ADD KANA LOCATIONS
// ================================
const dataSource = new Cesium.CustomDataSource("kana");
viewer.dataSources.add(dataSource);

window.KANA_LOCATIONS.forEach(loc => {
  dataSource.entities.add({
    id: loc.id,
    name: loc.name,
    position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat),
    cylinder: {
      length: 120,
      topRadius: 2,
      bottomRadius: 2,
      material: Cesium.Color.fromCssColorString("#FF2D8A")
    },
    label: {
      text: `${loc.name} • ${loc.onShift} on shift`,
      font: "14px system-ui",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      showBackground: true,
      backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
      pixelOffset: new Cesium.Cartesian2(0, -52)
    }
  });
});

// ================================
// SCOPE CONTROLS (OPTIONAL)
// ================================
window.flyScope = function(scope) {
  const s = window.SCOPES[scope];
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      s.lon,
      s.lat,
      s.height
    ),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 1.8
  });
};
``
