// ================================
// Cesium ion access token (REQUIRED for World Terrain)
// ================================
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMWEzNzczYi04Y2RhLTRjYzUtOTRmOC0xNGU0OGQxZjQ2ZDAiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE1BUCIsImlhdCI6MTc3ODYxMDU3Mn0.ASj9oPhBXb9_BVenzwxw3sRGf2uYl3_zb54IlfIELYY";

// ================================
// Create viewer with real imagery + real terrain
// ================================
const viewer = new Cesium.Viewer("map", {
  imageryProvider: Cesium.createWorldImagery({
    style: Cesium.IonWorldImageryStyle.AERIAL
  }),
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
// Critical scene tuning (THIS is what removes the blue blob feel)
// ================================
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;

// Prevent camera from diving into the globe
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 300;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;

// Slight atmospheric grounding
viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.00015;

// Ensure correct sizing
viewer.resize();

// ================================
// Cinematic fly-in to Kodiak
// ================================
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(
    -152.8,
