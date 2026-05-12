/* =========================================================
   KANA Spatial Intelligence – Stable Cesium Boot
   Fixes:
   - “Stars only” globe
   - Silent imagery/terrain failures
   - GitHub Pages + CDN variability
   ========================================================= */

// ---------------------------------------------------------
// 1) Cesium ion token (string required)
// ---------------------------------------------------------
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3Njc1NjE4YS1lMjA3LTQwODItODU2ZS1iMjRjZDU5MjIyZWQiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE5FVyIsImlhdCI6MTc3ODYxMTc4OH0.6J6Vqg0tOX-3ySsS_cBPEL5ffvb0gTO41-cOfCWnEg4";

// ---------------------------------------------------------
// 2) Minimal error overlay (visible, not silent)
// ---------------------------------------------------------
const errorOverlay = document.getElementById("errorOverlay");
function showError(msg) {
  errorOverlay.textContent = msg;
  errorOverlay.classList.remove("hidden");
  console.error(msg);
}

// ---------------------------------------------------------
// 3) Create viewer FIRST (no imagery, no terrain yet)
// ---------------------------------------------------------
const viewer = new Cesium.Viewer("map", {
  imageryProvider: false,
  baseLayerPicker: false,
  geocoder: false,
  timeline: false,
  animation: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  fullscreenButton: false,
  infoBox: false,
  selectionIndicator: false,
  shouldAnimate: true
});

// Force globe visibility (prevents “stars only”)
viewer.scene.globe.show = true;

// ---------------------------------------------------------
// 4) Attach imagery explicitly (with fallback)
// ---------------------------------------------------------
try {
  const imageryLayer = viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      credit: "Esri World Imagery"
    })
  );

  imageryLayer.alpha = 1.0;
} catch (e) {
  showError("Imagery failed to load. Check network/CDN.");
}

// ---------------------------------------------------------
// 5) Attach terrain explicitly (ion World Terrain asset 1)
// ---------------------------------------------------------
try {
  let terrain;

  if (Cesium.CesiumTerrainProvider?.fromIonAssetId) {
    terrain = Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
      requestWaterMask: true,
      requestVertexNormals: true
    });
  } else if (Cesium.IonResource?.fromAssetId) {
    terrain = new Cesium.CesiumTerrainProvider({
      url: Cesium.IonResource.fromAssetId(1),
      requestWaterMask: true,
      requestVertexNormals: true
    });
  } else {
    terrain = new Cesium.EllipsoidTerrainProvider();
  }

  viewer.terrainProvider = terrain;

  if (terrain.errorEvent) {
    terrain.errorEvent.addEventListener(err => {
      showError("Terrain failed to load (token or network issue).");
    });
  }
} catch (e) {
  showError("Terrain initialization error.");
}

// ---------------------------------------------------------
// 6) Scene tuning (critical for “real Earth” feel)
// ---------------------------------------------------------
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;

viewer.scene.screenSpaceCameraController.minimumZoomDistance = 600;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;

viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.00012;

viewer.resize();

// ---------------------------------------------------------
// 7) Cinematic fly-in to Kodiak
// ---------------------------------------------------------
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-152.8, 57.95, 140000),
  orientation: { pitch: Cesium.Math.toRadians(-55) },
  duration: 3
});

setTimeout(() => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-152.4074, 57.7909, 1600),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 2.4
  });
}, 2200);

// ---------------------------------------------------------
// 8) KANA locations (embedded, no external dependency)
// ---------------------------------------------------------
const KANA_LOCATIONS = [
  { id: "aehc", name: "Alutiiq Enwia Health Center", lat: 57.7909, lon: -152.4074, onShift: 23 },
  { id: "millbay", name: "Mill Bay Health Center", lat: 57.8042, lon: -152.3722, onShift: 29 },
  { id: "wellness", name: "Wellness Center", lat: 57.7899, lon: -152.4030, onShift: 12 },
  { id: "akhiok", name: "Akhiok Health Clinic", lat: 56.9458, lon: -154.1694, onShift: 2 },
  { id: "larsen", name: "Larsen Bay Health Clinic", lat: 57.5361, lon: -153.9806, onShift: 2 },
  { id: "anchorage", name: "JL Tower / Anchorage", lat: 61.2176, lon: -149.8997, onShift: 4 }
];

// ---------------------------------------------------------
// 9) Add KANA pins
// ---------------------------------------------------------
const ds = new Cesium.CustomDataSource("kana");
viewer.dataSources.add(ds);

KANA_LOCATIONS.forEach(loc => {
  ds.entities.add({
    id: loc.id,
    name: loc.name,
    position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat),
    cylinder: {
      length: 120,
      topRadius: 2.2,
      bottomRadius: 2.2,
      material: Cesium.Color.fromCssColorString("#FF2D8A").withAlpha(0.95)
    },
    label: {
      text: `${loc.name} • ${loc.onShift} on shift`,
      font: "600 14px system-ui",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      showBackground: true,
      backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
      pixelOffset: new Cesium.Cartesian2(0, -54)
    }
  });
});

// ---------------------------------------------------------
// 10) Scope buttons
// ---------------------------------------------------------
window.kanaFlyScope = function(scope) {
  const scopes = {
    kodiak: { lon: -152.4, lat: 57.79, height: 45000 },
    archipelago: { lon: -153.2, lat: 57.6, height: 200000 },
    anchorage: { lon: -149.9, lat: 61.21, height: 90000 },
    all: { lon: -151.8, lat: 58.7, height: 900000 }
  };

  const s = scopes[scope] || scopes.kodiak;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.height),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 1.8
  });
};

console.log("KANA Spatial Intelligence loaded.");
