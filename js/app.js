/* =========================================================
   KANA MAP (GitHub Pages stable)
   Fixes:
   - stars-only (no globe)
   - imagery/terrain failing silently
   - terrain provider Promise mismatch across Cesium builds
   ========================================================= */

window.__KANA_APP_LOADED__ = true;

// ========= 1) TOKEN (keep in quotes) =========
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3Njc1NjE4YS1lMjA3LTQwODItODU2ZS1iMjRjZDU5MjIyZWQiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE5FVyIsImlhdCI6MTc3ODYxMTc4OH0.6J6Vqg0tOX-3ySsS_cBPEL5ffvb0gTO41-cOfCWnEg4";


// ========= 2) Overlay helpers =========
const overlay = document.getElementById("errorOverlay");
function showOverlay(title, details) {
  overlay.textContent = `${title}\n\n${details || ""}`;
  overlay.classList.remove("hidden");
}
function clearOverlay() {
  overlay.classList.add("hidden");
  overlay.textContent = "";
}
function setStatus(msg) {
  // Use overlay as status until everything is loaded
  showOverlay("Loading…", msg);
}

// ========= 3) KANA LOCATIONS (embedded; no external file can break this) =========
const KANA_LOCATIONS = [
  // Kodiak (anchor a few; expand later once stable)
  { id: "aehc", name: "Alutiiq Enwia Health Center", lat: 57.7909, lon: -152.4074, onShift: 23 },
  { id: "millbay", name: "Mill Bay Health Center", lat: 57.8042, lon: -152.3722, onShift: 29 },
  { id: "wellness", name: "Wellness Center", lat: 57.7899, lon: -152.4030, onShift: 12 },

  // Villages (examples)
  { id: "akhiok", name: "Akhiok Health Clinic", lat: 56.9458, lon: -154.1694, onShift: 2 },
  { id: "larsen", name: "Larsen Bay Health Clinic", lat: 57.5361, lon: -153.9806, onShift: 2 },

  // Anchorage
  { id: "anchorage", name: "JL Tower / Anchorage", lat: 61.2176, lon: -149.8997, onShift: 4 }
];

const SCOPES = {
  kodiak: { lon: -152.4, lat: 57.79, height: 45000 },
  archipelago: { lon: -153.2, lat: 57.6, height: 200000 },
  anchorage: { lon: -149.9, lat: 61.21, height: 90000 },
  all: { lon: -151.8, lat: 58.7, height: 900000 }
};
window.kanaFlyScope = function (scope) {
  const s = SCOPES[scope] || SCOPES.kodiak;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.height),
    orientation: { pitch: Cesium.Math.toRadians(-35) },
    duration: 1.8
  });
};

// ========= 4) Create viewer FIRST (no imagery/terrain passed in) =========
setStatus("Creating viewer…");

const viewer = new Cesium.Viewer("map", {
  imageryProvider: false,         // we add imagery explicitly so failures are visible
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

// Force globe visible and visible even if imagery fails
viewer.scene.globe.show = true;
viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#102a43"); // prevents “stars only” look
viewer.scene.skyAtmosphere.show = true;

// Helpful camera constraints
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 600;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;

// Terrain/lighting tuning
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;
viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.00012;

viewer.resize();

// ========= 5) Add imagery with fallback (Esri → OSM) =========
function addImagery() {
  setStatus("Loading satellite imagery…");

  // Try Esri first
  try {
    viewer.imageryLayers.removeAll(true);
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri World Imagery"
      })
    );
    return true;
  } catch (e) {
    console.warn("Esri imagery failed, falling back:", e);
  }

  // Fallback to OSM
  try {
    viewer.imageryLayers.removeAll(true);
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        credit: "© OpenStreetMap contributors"
      })
    );
    return true;
  } catch (e) {
    showOverlay("Imagery failed to load", String(e));
    return false;
  }
}

// ========= 6) Add terrain SAFELY (handles Promise-returning APIs) =========
async function addTerrain() {
  setStatus("Loading real terrain (Cesium World Terrain)…");

  try {
    // Try fromIonAssetId if present (may return provider OR Promise depending on Cesium build)
    if (Cesium.CesiumTerrainProvider && typeof Cesium.CesiumTerrainProvider.fromIonAssetId === "function") {
      const maybePromise = Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
        requestWaterMask: true,
        requestVertexNormals: true
      });

      const provider = (maybePromise && typeof maybePromise.then === "function")
        ? await maybePromise
        : maybePromise;

      viewer.terrainProvider = provider;
      return true;
    }

    // Fallback: IonResource.fromAssetId + CesiumTerrainProvider
    if (Cesium.IonResource && typeof Cesium.IonResource.fromAssetId === "function" && Cesium.CesiumTerrainProvider) {
      viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
        url: Cesium.IonResource.fromAssetId(1),
        requestWaterMask: true,
        requestVertexNormals: true
      });
      return true;
    }

    // Last fallback: ellipsoid
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    showOverlay(
      "Terrain API fallback",
      "This Cesium build does not support ion terrain APIs. Using smooth globe."
    );
    return false;
  } catch (e) {
    showOverlay(
      "Terrain failed to load",
      "Most common causes:\n" +
      "• Ion token invalid/revoked\n" +
      "• Token URL restriction missing your GitHub Pages URL\n" +
      "• Network blocks api.cesium.com\n\n" +
      String(e)
    );
    return false;
  }
}

// ========= 7) Add KANA markers (simple + reliable: point + label) =========
function addKanaMarkers() {
  setStatus("Rendering KANA locations…");

  const ds = new Cesium.CustomDataSource("kana");
  viewer.dataSources.add(ds);

  KANA_LOCATIONS.forEach((loc) => {
    ds.entities.add({
      id: loc.id,
      name: loc.name,
      position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat, 0),
      point: {
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString("#FF2D8A"),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.2),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: `${loc.name} • ${loc.onShift} on shift`,
        font: "600 14px system-ui",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.65),
        outlineWidth: 3,
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.45),
        pixelOffset: new Cesium.Cartesian2(0, -22),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  });

  return ds;
}

// ========= 8) Cinematic fly-in (Kodiak → AEHC) =========
function flyIn() {
  setStatus("Cinematic fly-in…");

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
}

// ========= 9) Click-to-open info panel (minimal) =========
const infoPanel = document.getElementById("infoPanel");
function showInfo(entity) {
  infoPanel.innerHTML = `
    <h3>${entity.name || "Location"}</h3>
    <p class="muted">MOCK DATA · AI-assisted workflow — admin approval required.</p>
    <button class="btn-primary" onclick="alert('Interior modal coming next')">View Interior</button>
    <button class="btn-secondary" onclick="alert('Emergency mode coming next')">Emergency</button>
    <p class="muted">Future: iPhone LiDAR / Matterport / Polycam → AI builds room graph automatically.</p>
  `;
  infoPanel.classList.remove("hidden");
}
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((movement) => {
  const picked = viewer.scene.pick(movement.position);
  if (picked && picked.id) showInfo(picked.id);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// ========= 10) Boot sequence =========
(async function boot() {
  // 1) imagery
  addImagery();

  // 2) terrain
  await addTerrain();

  // 3) markers
  addKanaMarkers();

  // 4) fly-in
  flyIn();

  // Done
  clearOverlay();
  console.log("KANA MAP boot complete.");
})();
``
