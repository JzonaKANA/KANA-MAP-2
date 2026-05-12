// ================================
// Cesium ion access token (required for World Terrain)
// ================================
Cesium.Ion.defaultAccessToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMWEzNzczYi04Y2RhLTRjYzUtOTRmOC0xNGU0OGQxZjQ2ZDAiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE1BUCIsImlhdCI6MTc3ODYxMDU3Mn0.ASj9oPhBXb9_BVenzwxw3sRGf2uYl3_zb54IlfIELYY;

// ================================
// Use NON-ion imagery first (so the globe renders even if token is wrong)
// ================================
const esriImagery = new Cesium.UrlTemplateImageryProvider({
  url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  credit: "Esri"
});

// ================================
// Create viewer (imagery always renders; terrain uses ion token)
// ================================
const viewer = new Cesium.Viewer("map", {
  imageryProvider: esriImagery,
  terrainProvider: Cesium.createWorldTerrain({
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
// Debug logging (shows EXACTLY what's failing)
// ================================
viewer.terrainProvider.errorEvent.addEventListener((err) => {
  console.error("TERRAIN ERROR:", err);
});
viewer.scene.globe.tileLoadProgressEvent.addEventListener((n) => {
  // n goes to 0 when tiles finish loading
  // console.log("Tile load progress:", n);
});

// ================================
// Scene tuning (safe)
// ================================
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 300;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;

viewer.resize();
``
