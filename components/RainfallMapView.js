'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GEOJSON_TO_THAI_NAME } from '@/lib/constants/thailand-geojson-names';

// Sequential blue ramp (validated steps, light -> dark = low -> high rainfall).
function colorForValue(value) {
  if (value == null) return '#eef1f5';
  if (value <= 0) return '#eef1f5';
  if (value < 5) return '#b7d3f6';
  if (value < 15) return '#86b6ef';
  if (value < 35) return '#5598e7';
  if (value < 60) return '#2a78d6';
  if (value < 90) return '#1c5cab';
  return '#104281';
}

export default function RainfallMapView({ data, metric }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/geo/thailand-provinces.geojson')
      .then((res) => res.json())
      .then((json) => { if (!cancelled) setGeoData(json); });
    return () => { cancelled = true; };
  }, []);

  const valueByProvince = {};
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const entry = row[metric];
    valueByProvince[row.province] = entry ? entry.average : null;
  }

  function style(feature) {
    const thaiName = GEOJSON_TO_THAI_NAME[feature.properties.name];
    const value = thaiName ? valueByProvince[thaiName] : null;
    return {
      fillColor: colorForValue(value),
      fillOpacity: 0.9,
      color: '#ffffff',
      weight: 1,
    };
  }

  function onEachFeature(feature, layer) {
    const thaiName = GEOJSON_TO_THAI_NAME[feature.properties.name];
    const value = thaiName ? valueByProvince[thaiName] : null;
    const label = thaiName || feature.properties.name;
    let valueText;
    if (value == null) {
      valueText = 'ไม่มีข้อมูล';
    } else {
      valueText = `${Math.round(value * 10) / 10} มม.`;
    }
    layer.bindTooltip(`<b>${label}</b><br>${valueText}`, { sticky: true });
  }

  if (!geoData) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
        กำลังโหลดแผนที่...
      </div>
    );
  }

  return (
    <MapContainer
      center={[13.6, 101]}
      zoom={5.4}
      style={{ height: '100%', width: '100%', background: '#eef1f5' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <GeoJSON key={metric} data={geoData} style={style} onEachFeature={onEachFeature} />
    </MapContainer>
  );
}
