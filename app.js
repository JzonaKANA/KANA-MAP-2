const viewer = new Cesium.Viewer('map', { imageryProvider: new Cesium.UrlTemplateImageryProvider({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', credit: 'Esri' }), baseLayerPicker: false, geocoder: false, timeline: false, animation: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false, infoBox: false, selectionIndicator: false });

viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(-152.8, 57.95, 120000), orientation: { pitch: Cesium.Math.toRadians(-55) }, duration: 3 });

setTimeout(() => { viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(-152.4074, 57.7909, 1200), orientation: { pitch: Cesium.Math.toRadians(-35) }, duration: 2.2 }); }, 2200);

const dataSource = new Cesium.CustomDataSource('kana'); viewer.dataSources.add(dataSource);

KANA_LOCATIONS.forEach(loc => { dataSource.entities.add({ id: loc.id, name: loc.name, position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat), cylinder: { length: 120, topRadius: 2, bottomRadius: 2, material: Cesium.Color.fromCssColorString('#FF2D8A') }, label: { text: `${loc.name} • ${loc.onShift} on shift`, font: '14px system-ui', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 3, showBackground: true, backgroundColor: Cesium.Color.BLACK.withAlpha(0.5), pixelOffset: new Cesium.Cartesian2(0, -54) } }); });

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(movement => { const picked = viewer.scene.pick(movement.position); if (picked && picked.id) showInfo(picked.id); }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

function flyScope(scope) { const s = SCOPES[scope]; viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.height), orientation: { pitch: Cesium.Math.toRadians(-35) }, duration: 1.8 }); }