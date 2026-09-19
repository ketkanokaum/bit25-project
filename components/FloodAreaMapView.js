'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import {
  TAMBON_POINTS_URL,
  buildPointIndex,
  buildFloodMarkers,
  getMarkersCenter,
} from '@/lib/tambon-points';

// MapContainer อ่านค่า center แค่ตอนสร้างครั้งแรก เปลี่ยน prop ทีหลังแผนที่จะไม่ขยับ
// จึงต้องสั่งขยับเองทุกครั้งที่หมุดเปลี่ยน เพื่อให้แผนที่ตามจังหวัดที่เลือก
function FitToMarkers({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;

    // ถ้ากล่องแผนที่เพิ่งได้ขนาดจริง Leaflet ต้องวัดใหม่ก่อน ไม่งั้นจะคำนวณกรอบผิด
    map.invalidateSize();

    const bounds = [];
    for (let i = 0; i < markers.length; i++) {
      bounds.push([markers[i].lat, markers[i].lon]);
    }

    if (markers.length === 1) {
      map.setView(bounds[0], 11);
    } else {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [map, markers]);

  return null;
}

// นับจำนวนหมู่จากข้อความที่จัดรูปแบบไว้แล้ว เพื่อใช้กำหนดขนาดหมุด
function countMoo(mooText) {
  if (!mooText) return 0;
  const found = mooText.match(/\d+/g);
  if (!found) return 1;
  return found.length;
}

const ZOOM_ON_CLICK = 14;

// ปุ่มย้อนกลับไปดูภาพรวมทั้งจังหวัด หลังจากซูมเข้าไปดูตำบลใดตำบลหนึ่ง
function ResetViewButton({ markers }) {
  const map = useMap();

  function handleClick() {
    if (markers.length === 0) return;

    const bounds = [];
    for (let i = 0; i < markers.length; i++) {
      bounds.push([markers[i].lat, markers[i].lon]);
    }

    if (markers.length === 1) {
      map.setView(bounds[0], 11);
    } else {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={handleClick}
          className="bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          ดูทั้งจังหวัด
        </button>
      </div>
    </div>
  );
}

function getRadius(mooCount) {
  if (mooCount >= 5) return 11;
  if (mooCount >= 3) return 9;
  if (mooCount >= 2) return 7;
  return 6;
}

export default function FloodAreaMapView({ districts, province }) {
  const [points, setPoints] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // ใช้ useMemo เพื่อไม่ให้สร้าง markers ชุดใหม่ทุกครั้งที่ component วาดซ้ำ
  // ถ้าสร้างใหม่ทุกรอบ effect ที่ขยับแผนที่จะทำงานไม่จบ
  const index = useMemo(() => {
    if (!points) return null;
    return buildPointIndex(points);
  }, [points]);

  const markers = useMemo(() => {
    if (!index) return [];
    return buildFloodMarkers(districts, index, province).markers;
  }, [index, districts, province]);

  useEffect(() => {
    let cancelled = false;

    fetch(TAMBON_POINTS_URL)
      .then((res) => {
        if (!res.ok) throw new Error('โหลดไฟล์พิกัดไม่สำเร็จ');
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setPoints(json);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => { cancelled = true; };
  }, []);

  if (loadFailed) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
        ไม่สามารถโหลดข้อมูลพิกัดได้
      </div>
    );
  }

  if (!points) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
        กำลังโหลดแผนที่...
      </div>
    );
  }

  const center = getMarkersCenter(markers);

  if (markers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
        ไม่พบพิกัดของพื้นที่ที่เคยเกิดอุทกภัย
      </div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={9}
      maxZoom={18}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', background: '#eef1f5' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={18}
      />

      <FitToMarkers markers={markers} />
      <ResetViewButton markers={markers} />

      {markers.map((marker) => (
        <CircleMarker
          key={marker.key}
          center={[marker.lat, marker.lon]}
          radius={getRadius(countMoo(marker.mooText))}
          pathOptions={{
            color: '#ffffff',
            weight: 1.5,
            fillColor: marker.level === 'tambon' ? '#dc2626' : '#f59e0b',
            fillOpacity: 0.75,
          }}
          eventHandlers={{
            // แตะหมุดแล้วซูมเข้าไปดูบริเวณตำบลนั้น
            click: (event) => {
              event.target._map.flyTo([marker.lat, marker.lon], ZOOM_ON_CLICK);
            },
          }}
        >
          <Popup>
            <div className="text-[13px] leading-relaxed">
              <div className="font-bold text-slate-800">
                ตำบล{marker.subdistrict}
              </div>
              <div className="text-slate-500">อำเภอ{marker.district}</div>
              <div className="mt-1 text-slate-700">{marker.mooText}</div>
              <div className="mt-1 text-slate-400 text-[11px]">
                ปีที่เคยมีรายงาน {marker.years.map((y) => y + 543).join(', ')}
              </div>
              {marker.level === 'district' && (
                <div className="mt-1 text-amber-600 text-[11px]">
                  แสดงที่จุดกลางอำเภอ เพราะไม่พบพิกัดของตำบลนี้
                </div>
              )}
              <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-slate-400 text-[11px]">
                หมุดอยู่ที่จุดกลางตำบล ไม่ใช่ตำแหน่งของหมู่
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
