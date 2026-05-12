const KANA_LOCATIONS = [
  { id: 'aehc', name: 'Alutiiq Enwia Health Center', lat: 57.7909, lon: -152.4074, hours: 'M–F 8AM–6PM', phone: '907-486-9800', onShift: 23 },
  { id: 'millbay', name: 'Mill Bay Health Center', lat: 57.8042, lon: -152.3722, hours: 'M–F 8AM–6PM', phone: '907-486-9870', onShift: 29 },
  { id: 'akhiok', name: 'Akhiok Health Clinic', lat: 56.9458, lon: -154.1694, hours: 'M–F 8AM–4:30PM', phone: '907-836-2230', onShift: 2 },
  { id: 'anchorage', name: 'JL Tower / Koniag Anchorage Space', lat: 61.2176, lon: -149.8997, hours: 'Business hours', phone: 'Internal', onShift: 4 }
];

const SCOPES = {
  kodiak: { lat: 57.79, lon: -152.4, height: 30000 },
  archipelago: { lat: 57.6, lon: -153.2, height: 150000 },
  anchorage: { lat: 61.21, lon: -149.9, height: 70000 },
  all: { lat: 58.7, lon: -151.8, height: 900000 }
};