/* =========================================================
   KANA Spatial Intelligence – GitHub Pages stable build
   Goal: “Google Earth + Zillow” baseline reliability first.
   ========================================================= */

// -------------------------------
// 0) EDIT THIS ONE LINE ONLY
// -------------------------------
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3Njc1NjE4YS1lMjA3LTQwODItODU2ZS1iMjRjZDU5MjIyZWQiLCJpZCI6NDMwNzQ2LCJzdWIiOiJKem9uYSIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLQU5BIE5FVyIsImlhdCI6MTc3ODYxMTc4OH0.6J6Vqg0tOX-3ySsS_cBPEL5ffvb0gTO41-cOfCWnEg4"; // keep quotes

// -------------------------------
// 1) Error overlay (no silent failures)
// -------------------------------
const overlay = document.getElementById("errorOverlay");
function showError(title, details) {
  overlay.classList.remove("hidden");
  overlay.textContent = `${title}\n\n${details || ""}`;
  console.error(title, details);
}
window.addEventListener("error", (e) => showError("Runtime error", e?.error?.stack || e?.message || String(e)));
window.addEventListener("unhandledrejection", (e) => showError("Unhandled rejection", e?.reason?.stack || e?.reason || String(e)));

// -------------------------------
// 2) KANA Locations (OFFICIAL LIST, mock-safe fields)
// No PHI, no real staff.
// -------------------------------
const KANA_LOCATIONS = [
  // Kodiak (8)
  { id: "aehc", name: "Alutiiq Enwia Health Center", lat: 57.7909, lon: -152.4074, onShift: 23, hours: "M-F 8AM-6PM", phone: "907-486-9800" },
  { id: "camai", name: "Cama’i Center", lat: 57.7969, lon: -152.3899, onShift: 9, hours: "M-F 8AM-6PM", phone: "907-486-1397" },
  { id: "carolyn", name: "Carolyn Street", lat: 57.7902, lon: -152.4069, onShift: 6, hours: "M-F 8AM-5PM", phone: "907-486-7380" },
  { id: "cac", name: "Child Advocacy Center", lat: 57.7918, lon: -152.4046, onShift: 5, hours: "M-F 8AM-5PM", phone: "907-486-1378" },
  { id: "csc", name: "Community Services Center", lat: 57.7889, lon: -152.4012, onShift: 11, hours: "M-F 8AM-6PM", phone: "907-486-9879" },
  { id: "marketplace", name: "Kodiak Marketplace", lat: 57.7896, lon: -152.4098, onShift: 7, hours: "7 days/week", phone: "907-486-9800" },
  { id: "millbay", name: "Mill Bay Health Center", lat: 57.8042, lon: -152.3722, onShift: 29, hours: "M-F 8AM-6PM • Sat 8AM-5PM", phone: "907-486-9870" },
  { id: "wellness", name: "Wellness Center", lat: 57.7899, lon: -152.4030, onShift: 12, hours: "M-F 5:30AM-8PM • Sat-Sun 8AM-2PM", phone: "907-486-1377" },

  // Villages (5)
  { id: "akhiok", name: "Akhiok Health Clinic", lat: 56.9458, lon: -154.1694, onShift: 2, hours: "M-F 8AM-4:30PM", phone: "907-836-2230" },
  { id: "larsen", name: "Larsen Bay Health Clinic", lat: 57.5361, lon: -153.9806, onShift: 2, hours: "M-F 8AM-4:30PM", phone: "907-847-2208" },
  { id: "oldharbor", name: "Old Harbor Health Clinic", lat: 57.2025, lon: -153.3053, onShift: 2, hours: "M-F 8AM-4:30PM", phone: "907-286-2205" },
  { id: "ouzinkie", name: "Ouzinkie Health Clinic", lat: 57.9225, lon: -152.5011, onShift: 2, hours: "M-F 8AM-4:30PM", phone: "907-680-2265" },
  { id: "portlions", name: "Port Lions Health Clinic", lat: 57.8689, lon: -152.8826, onShift: 2, hours: "M-F 8AM-4:30PM", phone: "907-454-2275" },

  // Anchorage (1)
  { id: "anchorage", name: "JL Tower / Koniag shared Anchorage space", lat: 61.2176, lon: -149.8997, onShift: 4, hours: "Business hours", phone: "Internal" }
];

const SCOPES = {
  kodiak: { lon: -152.4, lat: 57.79, height: 45000 },
  archipelago: { lon: -153.2, lat: 57.6, height: 200000 },
  anchorage: { lon: -149.9, lat: 61.21, height: 90000 },
  all: { lon: -151.8, lat: 58.7, height: 900000 }
};

// -------------------------------
// 3) Imagery provider with fallback
// -------------------------------
function buildImagery() {
  try {
    return new Cesium.UrlTemplateImageryProvider({
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      credit: "Esri"
    });
  } catch (e) {
    return new Cesium.UrlTemplateImageryProvider({
      url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      credit: "© OpenStreetMap contributors"
    });
  }
}

// -------------------------------
// 4) Terrain provider (ion World Terrain asset id 1) with fallbacks
// -------------------------------
function buildTerrain() {
  // Prefer fromIonAssetId if available
  if (Cesium.CesiumTerrainProvider && typeof Cesium.CesiumTerrainProvider.fromIonAssetId === "function") {
    return Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
      requestWaterMask: true,
      requestVertexNormals: true
    });
  }

  // Fallback: IonResource + CesiumTerrainProvider
  if (Cesium.IonResource && typeof Cesium.IonResource.fromAssetId === "function" && Cesium.CesiumTerrainProvider) {
    return new Cesium.CesiumTerrainProvider({
      url: Cesium.IonResource.fromAssetId(1),
      requestWaterMask: true,
      requestVertexNormals: true
    });
  }

  // Last fallback: ellipsoid
  return new Cesium.EllipsoidTerrainProvider();
}

// -------------------------------
// 5) Create viewer first (then verify globe is on)
// -------------------------------
let viewer;
try {
  viewer = new Cesium.Viewer("map", {
    imageryProvider: buildImagery(),
    terrainProvider: buildTerrain(),
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
  showError("Failed to create Cesium Viewer", e?.stack || String(e));
  throw e;
}

// Force globe visibility (prevents “stars only”)
viewer.scene.globe.show = true;

