// =====================================================
// KANA Spatial Intelligence Demo (GitHub Pages safe)
// Fixes: token string quoting + terrain + camera + errors
// =====================================================

// 1) Cesium ion token (REQUIRED for Cesium World Terrain)
// IMPORTANT: must be in quotes. Example: "eyJhbGciOi..."
// Manage/rotate tokens in the Cesium ion Access Tokens dashboard. [1](https://stackoverflow.com/questions/76220837/i-cant-get-mapbox-to-work-in-my-next-js-app)[2](https://medium.com/@pether.maciejewski/next-js-13-mapbox-deck-gl-hexagon-layer-step-by-step-5528e7366750)
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMWEzNzczYi04Y2RhLTRjYzUtOTRmOC0xNGU0OGQxZjQ2ZDAiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE1BUCIsImlhdCI6MTc3ODYxMDU3Mn0.ASj9oPhBXb9_BVenzwxw3sRGf2uYl3_zb54IlfIELYY";

// 2) Always-on error overlay so we never get “mystery black screens” again
(function attachErrorOverlay() {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;left:12px;bottom:12px;max-width:520px;z-index:99999;" +
    "background:rgba(0,0,0,.75);border:1px solid rgba(255,255,255,.15);" +
    "border-radius:12px;padding:10px 12px;color:#fff;font:12px system-ui;" +
    "backdrop-filter:blur(10px);display:none;white-space:pre-wrap;";
  overlay.id = "errorOverlay";
  document.body.appendChild(overlay);

  window.addEventListener("error", (e) => {
    overlay.style.display = "block";
    overlay.textContent =
      "Runtime error (this causes black screen):\n\n" +
      (e?.error?.stack || e?.message || String(e));
  });

  window.addEventListener("unhandledrejection", (e) => {
    overlay.style.display = "block";
    overlay.textContent =
      "Unhandled promise rejection:\n\n" +
      (e?.reason?.stack || e?.reason || String(e));
  });
})();

// 3) Imagery (non-ion) so the globe still renders even if ion token has issues
const esriImagery = new Cesium.UrlTemplateImageryProvider({
  url:
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  credit: "Esri",
});

// 4) Terrain (ion-backed): Cesium World Terrain with water mask + normals
// This is the documented pattern for World Terrain + water + lighting normals. [3](https://dev.to/sakshamgurung/how-to-use-mapbox-in-nextjs-j7k)[4](https://www.anmoldeep.dev/writing/next-mapbox-maps)
const worldTerrain = Cesium.createWorldTerrain({
  requestWaterMask: true,
  requestVertexNormals: true,
});

// 5) Create Viewer
const viewer = new Cesium.Viewer("map", {
  imageryProvider: esriImagery,
  terrainProvider: worldTerrain,
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
  shouldAnimate: true,
});

// 6) Debug terrain errors (very useful for token problems)
viewer.terrainProvider.errorEvent.addEventListener((err) => {
  console.error("TERRAIN ERROR:", err);
  const overlay = document.getElementById("errorOverlay");
  if (overlay) {
    overlay.style.display = "block";
    overlay.textContent =
      "Terrain failed to load.\n\nMost common causes:\n" +
      "• Invalid/revoked token\n• Token URL restrictions don’t include your GitHub Pages URL\n• Network blocks api.cesium.com\n\nDetails:\n" +
      (err?.message || JSON.stringify(err));
  }
});

// 7) Scene tuning to prevent “blue ball / diving into globe”
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 300;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;

// Optional: slightly reduce “haze” and keep things crisp
viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.00012;

viewer.resize();

// 8) Cinematic fly-in to Kodiak → Alutiiq Enwia Health Center
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-152.8, 57.95, 120000),
  orientation: { pitch: Cesium.Math.toRadians(-55) },
  duration: 3,
});

setTimeout(() => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-152.4074, 57.7909, 1200),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 2.2,
  });
}, 2200);

// 9) KANA location entities
const dataSource = new Cesium.CustomDataSource("kana");
viewer.dataSources.add(dataSource);

KANA_LOCATIONS.forEach((loc) => {
  dataSource.entities.add({
    id: loc.id,
    name: loc.name,
    position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat),
    // Small non-invasive pad
    ellipse: {
      semiMajorAxis: 26,
      semiMinorAxis: 18,
      material: Cesium.Color.fromCssColorString("#20E0FF").withAlpha(0.12),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString("#20E0FF").withAlpha(0.35),
    },
    // Glowing vertical pin
    cylinder: {
      length: 120,
      topRadius: 2,
      bottomRadius: 2,
      material: Cesium.Color.fromCssColorString("#FF2D8A").withAlpha(0.9),
      outline: true,
      outlineColor: Cesium.Color.WHITE.withAlpha(0.12),
    },
    // Readable label
    label: {
      text: `${loc.name} • ${loc.onShift} on shift`,
      font: "600 14px system-ui",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK.withAlpha(0.65),
      outlineWidth: 3,
      showBackground: true,
      backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
      pixelOffset: new Cesium.Cartesian2(0, -54),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 250000),
    },
  });
});

// 10) Click handler → info panel
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(
  (movement) => {
    const picked = viewer.scene.pick(movement.position);
    if (picked && picked.id) showInfo(picked.id);
  },
  Cesium.ScreenSpaceEventType.LEFT_CLICK
);

// 11) Scope fly controls
function flyScope(scope) {
  const s = SCOPES[scope];
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.height),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 1.8,
  });
}
