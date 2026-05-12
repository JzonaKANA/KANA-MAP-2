/* =========================================================
   KANA MAP – Cesium boot (GitHub Pages safe, older Cesium safe)
   Fixes:
   - createWorldTerrain not available → use ion assetId 1 terrain provider
   - Black screen debugging overlay
   - Safer imagery fallback
   ========================================================= */

// ---------------------------------------------------------
// 1) Cesium ion token (REQUIRED for ion World Terrain)
// IMPORTANT: must be a STRING in quotes.
// Do NOT paste tokens into chat. Rotate/restrict in ion dashboard. [1](https://stackoverflow.com/questions/76220837/i-cant-get-mapbox-to-work-in-my-next-js-app)[2](https://medium.com/@pether.maciejewski/next-js-13-mapbox-deck-gl-hexagon-layer-step-by-step-5528e7366750)
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMWEzNzczYi04Y2RhLTRjYzUtOTRmOC0xNGU0OGQxZjQ2ZDAiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE1BUCIsImlhdCI6MTc3ODYxMDU3Mn0.ASj9oPhBXb9_BVenzwxw3sRGf2uYl3_zb54IlfIELYY";

// ---------------------------------------------------------
// 2) On-screen overlay for errors (no more guessing)
// ---------------------------------------------------------
function showOverlay(title, details) {
  let el = document.getElementById("kanaOverlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "kanaOverlay";
    el.style.cssText =
      "position:fixed;left:12px;bottom:12px;right:12px;max-width:980px;z-index:99999;" +
      "background:rgba(0,0,0,.78);border:1px solid rgba(255,255,255,.18);" +
      "border-radius:14px;padding:12px 14px;color:#fff;font:12px system-ui;" +
      "backdrop-filter:blur(10px);white-space:pre-wrap;";
    document.body.appendChild(el);
  }
  el.innerHTML = `<div style="font-weight:800;margin-bottom:6px">${title}</div>${details || ""}`;
}

window.addEventListener("error", (e) => {
  showOverlay(
    "Runtime error (this causes black screen)",
    (e?.error?.stack || e?.message || String(e))
  );
});

window.addEventListener("unhandledrejection", (e) => {
  showOverlay(
    "Unhandled promise rejection",
    (e?.reason?.stack || e?.reason || String(e))
  );
});

// ---------------------------------------------------------
// 3) Ensure Cesium loaded
// ---------------------------------------------------------
if (!window.Cesium) {
  showOverlay(
    "Cesium did not load",
    "The Cesium.js script did not execute.\n" +
      "Check index.html loads:\n" +
      "https://cdn.jsdelivr.net/npm/cesium@1.124.0/Build/Cesium/Cesium.js\n\n" +
      "If your network blocks jsdelivr, we can swap CDNs."
  );
  throw new Error("Cesium missing");
}

// ---------------------------------------------------------
// 4) Imagery provider (non-ion) – reliable on static hosting
// ---------------------------------------------------------
function makeImageryProvider() {
  // Esri world imagery is simple and usually works; if blocked, we fall back to OSM.
  try {
    return new Cesium.UrlTemplateImageryProvider({
      url:
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      credit: "Esri",
    });
  } catch (e) {
    return new Cesium.UrlTemplateImageryProvider({
      url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      credit: "© OpenStreetMap contributors",
    });
  }
}

// ---------------------------------------------------------
// 5) Terrain provider – works even when createWorldTerrain() is missing
//    Cesium World Terrain is ion assetId 1.
//    We try the newest API, then fall back to older compatible API.
// ---------------------------------------------------------
function makeWorldTerrainProvider() {
  // Try: CesiumTerrainProvider.fromIonAssetId (supported in many builds)
  if (Cesium.CesiumTerrainProvider && typeof Cesium.CesiumTerrainProvider.fromIonAssetId === "function") {
    return Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
      requestWaterMask: true,
      requestVertexNormals: true,
    });
  }

  // Fallback: IonResource.fromAssetId + CesiumTerrainProvider({ url })
  if (Cesium.IonResource && typeof Cesium.IonResource.fromAssetId === "function" && Cesium.CesiumTerrainProvider) {
    return new Cesium.CesiumTerrainProvider({
      url: Cesium.IonResource.fromAssetId(1),
      requestWaterMask: true,
      requestVertexNormals: true,
    });
  }

  // Last fallback: Ellipsoid (no terrain)
  showOverlay(
    "World Terrain API not available",
    "Your Cesium build does not support ion terrain APIs.\n" +
      "We will fall back to a smooth globe.\n" +
      "Fix: Update Cesium CDN version in index.html to 1.124.0."
  );
  return new Cesium.EllipsoidTerrainProvider();
}

// ---------------------------------------------------------
// 6) Create Viewer (wrapped so any error shows overlay)
// ---------------------------------------------------------
let viewer;
try {
  viewer = new Cesium.Viewer("map", {
    imageryProvider: makeImageryProvider(),
    terrainProvider: makeWorldTerrainProvider(),
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
} catch (e) {
  showOverlay("Failed to create Cesium Viewer", e?.stack || String(e));
  throw e;
}

// Terrain error events (token issues show up here)
if (viewer.terrainProvider && viewer.terrainProvider.errorEvent) {
  viewer.terrainProvider.errorEvent.addEventListener((err) => {
    console.error("TERRAIN ERROR:", err);
    showOverlay(
      "Terrain failed to load (token/network)",
      "Most common causes:\n" +
        "• Token missing/invalid/revoked\n" +
        "• Token URL restriction doesn't include your GitHub Pages URL\n" +
        "• Network blocks api.cesium.com\n\n" +
        "Details:\n" +
        (err?.message || JSON.stringify(err))
    );
  });
}

// ---------------------------------------------------------
// 7) Scene tuning (prevents “blue ball / diving into globe” feel)
// ---------------------------------------------------------
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 300;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;

viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.00012;

viewer.resize();

// ---------------------------------------------------------
// 8) Cinematic fly-in: Kodiak → Alutiiq Enwia Health Center
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 9) KANA locations
//    Requires:
//    - KANA_LOCATIONS defined in data/kanaLocations.js
//    - SCOPES defined in data/kanaLocations.js
//    - showInfo defined in js/interiorMock.js
// ---------------------------------------------------------
const dataSource = new Cesium.CustomDataSource("kana");
viewer.dataSources.add(dataSource);

if (!window.KANA_LOCATIONS) {
  showOverlay(
    "KANA_LOCATIONS not found",
    "data/kanaLocations.js did not load or the variable name differs.\n" +
      "Expected: const KANA_LOCATIONS = [...]"
  );
} else {
  window.KANA_LOCATIONS.forEach((loc) => {
    dataSource.entities.add({
      id: loc.id,
      name: loc.name,
      position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat),

      // small non-invasive pad (keeps roads visible)
      ellipse: {
        semiMajorAxis: 26,
        semiMinorAxis: 18,
        material: Cesium.Color.fromCssColorString("#20E0FF").withAlpha(0.12),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#20E0FF").withAlpha(0.35),
      },

      // glowing vertical pin
      cylinder: {
        length: 120,
        topRadius: 2,
        bottomRadius: 2,
        material: Cesium.Color.fromCssColorString("#FF2D8A").withAlpha(0.9),
        outline: true,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.12),
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
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 250000),
      },
    });
  });
}

// ---------------------------------------------------------
// 10) Click handling
// ---------------------------------------------------------
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((movement) => {
  const picked = viewer.scene.pick(movement.position);
  if (picked && picked.id && typeof window.showInfo === "function") {
    window.showInfo(picked.id);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// ---------------------------------------------------------
// 11) Scope fly controls (wired to HTML buttons)
// ---------------------------------------------------------
window.flyScope = function flyScope(scope) {
  if (!window.SCOPES) {
    showOverlay(
      "SCOPES not found",
      "Expected SCOPES = { kodiak:{...}, archipelago:{...}, ... } in data/kanaLocations.js"
    );
    return;
  }
  const s = window.SCOPES[scope];
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.height),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 1.8,
  });
};

console.log("Cesium viewer created successfully.");
