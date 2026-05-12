/* =========================================================
   KANA MAP – Cesium boot (GitHub Pages safe)
   Fixes: silent black screen, HTML-escaped chars, terrain fallback
   ========================================================= */

// 0) OPTIONAL: Cesium ion token (recommended for high-quality World Terrain)
// IMPORTANT: token must be a STRING in quotes.
// If you rotated/revoked your token, update it here.
// SECURITY: do NOT paste your token into chat.
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMWEzNzczYi04Y2RhLTRjYzUtOTRmOC0xNGU0OGQxZjQ2ZDAiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE1BUCIsImlhdCI6MTc3ODYxMDU3Mn0.ASj9oPhBXb9_BVenzwxw3sRGf2uYl3_zb54IlfIELYY";

// 1) Always show errors on screen (so we never guess again)
function showOverlay(title, details) {
  let el = document.getElementById("kanaOverlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "kanaOverlay";
    el.style.cssText =
      "position:fixed;left:12px;bottom:12px;right:12px;max-width:900px;z-index:99999;" +
      "background:rgba(0,0,0,.78);border:1px solid rgba(255,255,255,.18);" +
      "border-radius:14px;padding:12px 14px;color:#fff;font:12px system-ui;" +
      "backdrop-filter:blur(10px);white-space:pre-wrap;";
    document.body.appendChild(el);
  }
  el.innerHTML = `<div style="font-weight:800;margin-bottom:6px">${title}</div>${details || ""}`;
}

window.addEventListener("error", (e) => {
  showOverlay("Runtime error (this causes black screen)", (e?.error?.stack || e?.message || String(e)));
});
window.addEventListener("unhandledrejection", (e) => {
  showOverlay("Unhandled promise rejection", (e?.reason?.stack || e?.reason || String(e)));
});

// 2) Confirm Cesium exists
if (!window.Cesium) {
  showOverlay(
    "Cesium did not load",
    "The Cesium.js script tag did not execute.\n" +
      "Check index.html loads:\n" +
      "https://cdn.jsdelivr.net/npm/cesium@1.124.0/Build/Cesium/Cesium.js\n\n" +
      "If your org blocks jsdelivr, we can swap CDNs."
  );
  throw new Error("Cesium missing");
}

// 3) Pick an imagery provider that’s reliable on public hosting
// (We try Esri first; if it fails, we fall back to OpenStreetMap.)
function makeImageryProvider() {
  try {
    return new Cesium.UrlTemplateImageryProvider({
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      credit: "Esri"
    });
  } catch {
    return new Cesium.UrlTemplateImageryProvider({
      url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      credit: "© OpenStreetMap contributors"
    });
  }
}

// 4) Terrain: try Cesium World Terrain (needs ion token), else fall back to ellipsoid
function makeTerrainProvider() {
  try {
    return Cesium.createWorldTerrain({
      requestWaterMask: true,
      requestVertexNormals: true
    });
  } catch (e) {
    console.warn("World terrain unavailable, using ellipsoid:", e);
    return new Cesium.EllipsoidTerrainProvider();
  }
}

// 5) Create the viewer (inside try/catch so errors display)
let viewer;
try {
  viewer = new Cesium.Viewer("map", {
    imageryProvider: makeImageryProvider(),
    terrainProvider: makeTerrainProvider(),
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
} catch (e) {
  showOverlay("Failed to create Cesium Viewer", e?.stack || String(e));
  throw e;
}

// 6) Terrain error debugging (this will reveal token issues instantly)
if (viewer.terrainProvider && viewer.terrainProvider.errorEvent) {
  viewer.terrainProvider.errorEvent.addEventListener((err) => {
    console.error("TERRAIN ERROR:", err);
    showOverlay(
      "Terrain failed to load (token/network)",
      "Most common causes:\n" +
        "• Token is missing / revoked / not in quotes\n" +
        "• Token URL restriction doesn't include your GitHub Pages URL\n" +
        "• Network blocks api.cesium.com\n\n" +
        "Details:\n" +
        (err?.message || JSON.stringify(err))
    );
  });
}

// 7) Scene tuning to prevent “blue blob / diving into globe”
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 300;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;
viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.00012;

viewer.resize();

// 8) Cinematic fly-in to Kodiak → Alutiiq Enwia Health Center
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-152.8, 57.95, 120000),
  orientation: { pitch: Cesium.Math.toRadians(-55) },
  duration: 3
});

setTimeout(() => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-152.4074, 57.7909, 1200),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 2.2
  });
}, 2200);

// 9) Add KANA locations (requires KANA_LOCATIONS from data/kanaLocations.js)
const dataSource = new Cesium.CustomDataSource("kana");
viewer.dataSources.add(dataSource);

if (!window.KANA_LOCATIONS) {
  showOverlay(
    "KANA_LOCATIONS not found",
    "data/kanaLocations.js did not load or variable name differs.\n" +
      "Expected: const KANA_LOCATIONS = [...]"
  );
} else {
  window.KANA_LOCATIONS.forEach((loc) => {
    dataSource.entities.add({
      id: loc.id,
      name: loc.name,
      position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat),
      ellipse: {
        semiMajorAxis: 26,
        semiMinorAxis: 18,
        material: Cesium.Color.fromCssColorString("#20E0FF").withAlpha(0.12),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#20E0FF").withAlpha(0.35)
      },
      cylinder: {
        length: 120,
        topRadius: 2,
        bottomRadius: 2,
        material: Cesium.Color.fromCssColorString("#FF2D8A").withAlpha(0.9),
        outline: true,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.12)
      },
      label: {
        text: `${loc.name} • ${loc.onShift} on shift`,
        font: "600 14px system-ui",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.65),
        outlineWidth: 3,
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
        pixelOffset: new Cesium.Cartesian2(0, -54),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 250000)
      }
    });
  });
}

// 10) Click handling
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((movement) => {
  const picked = viewer.scene.pick(movement.position);
  if (picked && picked.id && window.showInfo) window.showInfo(picked.id);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// 11) Make flyScope available to your HTML buttons
window.flyScope = function flyScope(scope) {
  if (!window.SCOPES) {
    showOverlay("SCOPES not found", "Expected SCOPES = { kodiak:{...}, ... } in data/kanaLocations.js");
    return;
  }
  const s = window.SCOPES[scope];
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.height),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 1.8
  });
};

// 12) Success indicator
console.log("Cesium viewer created successfully.");
