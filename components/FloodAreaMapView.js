'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import {
  TAMBON_POINTS_URL,
  buildPointIndex,
  buildFloodMarkers,
  getMarkersCenter,
} from '@/lib/tambon-points';

// ซูมน้อยกว่าค่านี้ = แสดงหมุดรวมเป็นกลุ่มระดับอำเภอ เพื่อลดความรกตอนดูภาพรวมทั้งจังหวัด
// ซูมมากกว่าหรือเท่ากับค่านี้ = แสดงหมุดตำบลแยกทีละจุดตามจริง
const CLUSTER_ZOOM_THRESHOLD = 12;

// สีของหมุด: ใช้โทนน้ำเงินแทนแดง เพื่อไม่ให้เข้าใจผิดว่าเป็นพื้นที่กำลังน้ำท่วมอยู่ตอนนี้
// (แดงมักถูกอ่านว่าเป็นสัญญาณอันตรายเฉพาะหน้า ทั้งที่ข้อมูลนี้คือประวัติในอดีต)
const COLOR_TAMBON = '#2563eb';
const COLOR_DISTRICT_FALLBACK = '#f59e0b';
const COLOR_CLUSTER = '#1e3a8a';

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

// ติดตามระดับซูมปัจจุบัน เพื่อตัดสินใจว่าจะแสดงหมุดรวมกลุ่มหรือแยกทีละตำบล
function ZoomWatcher({ onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

// นับจำนวนหมู่จากข้อความที่จัดรูปแบบไว้แล้ว เพื่อใช้กำหนดขนาดหมุด
function countMoo(mooText) {
  if (!mooText) return 0;
  const found = mooText.match(/\d+/g);
  if (!found) return 1;
  return found.length;
}

// แปลงปี ค.ศ. เป็น พ.ศ. แล้วต่อเป็นข้อความคั่นด้วยจุลภาค เช่น "2563, 2565"
function buildYearsText(years) {
  const buddhistYears = [];
  for (let i = 0; i < years.length; i++) {
    buddhistYears.push(years[i] + 543);
  }
  return buddhistYears.join(', ');
}

// สร้างรายการ <li> จากตำบลที่หาพิกัดไม่เจอ ใช้ร่วมกันทั้งใน UnmatchedNotice และตอนไม่มีหมุดเลย
function buildUnmatchedListItems(unmatched, districtLabel, subdistrictLabel) {
  const items = [];
  for (let i = 0; i < unmatched.length; i++) {
    const item = unmatched[i];
    items.push(
      <li key={i}>
        {districtLabel}{item.district} · {subdistrictLabel}{item.subdistrict}
      </li>
    );
  }
  return items;
}

const ZOOM_ON_CLICK = 14;
const ZOOM_ON_CLUSTER_CLICK = 13;

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

// แจ้งรายชื่อตำบลที่หาพิกัดไม่เจอเลย (ไม่มีแม้แต่จุดกลางอำเภอให้ตกไปใช้) แทนการปล่อยให้หายไปเงียบๆ
function UnmatchedNotice({ unmatched, districtLabel, subdistrictLabel }) {
  if (!unmatched || unmatched.length === 0) return null;

  const listItems = buildUnmatchedListItems(unmatched, districtLabel, subdistrictLabel);

  return (
    <div className="leaflet-bottom leaflet-left">
      <div className="leaflet-control bg-white/95 rounded-lg border border-amber-200 shadow-sm px-3 py-2 text-[11px] text-slate-600 max-w-[240px]">
        <div className="font-bold text-amber-700 mb-1">
          ไม่พบพิกัดอีก {unmatched.length} {subdistrictLabel}
        </div>
        <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto">
          {listItems}
        </ul>
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

// รวมหมุดตำบลที่อยู่ในอำเภอเดียวกันเป็นจุดเดียว ใช้ตอนซูมออกดูภาพรวมทั้งจังหวัด
function buildDistrictClusters(markers) {
  const byDistrict = {};

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    if (!byDistrict[marker.district]) {
      byDistrict[marker.district] = {
        district: marker.district,
        latSum: 0,
        lonSum: 0,
        count: 0,
        mooCount: 0,
      };
    }
    const group = byDistrict[marker.district];
    group.latSum += marker.lat;
    group.lonSum += marker.lon;
    group.count += 1;
    group.mooCount += countMoo(marker.mooText);
  }

  const clusters = [];
  for (const district in byDistrict) {
    const group = byDistrict[district];
    clusters.push({
      district: district,
      lat: group.latSum / group.count,
      lon: group.lonSum / group.count,
      tambonCount: group.count,
      mooCount: group.mooCount,
    });
  }
  return clusters;
}

export default function FloodAreaMapView({ districts, province }) {
  const [points, setPoints] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [zoom, setZoom] = useState(9);

  const districtLabel = province === "กรุงเทพมหานคร" ? "เขต" : "อำเภอ";
  const subdistrictLabel = province === "กรุงเทพมหานคร" ? "แขวง" : "ตำบล";

  // ใช้ useMemo เพื่อไม่ให้สร้าง markers ชุดใหม่ทุกครั้งที่ component วาดซ้ำ
  // ถ้าสร้างใหม่ทุกรอบ effect ที่ขยับแผนที่จะทำงานไม่จบ
  const index = useMemo(() => {
    if (!points) return null;
    return buildPointIndex(points);
  }, [points]);

  const markerResult = useMemo(() => {
    if (!index) return { markers: [], unmatched: [] };
    return buildFloodMarkers(districts, index, province);
  }, [index, districts, province]);
  const markers = markerResult.markers;
  const unmatched = markerResult.unmatched;

  const clusters = useMemo(() => buildDistrictClusters(markers), [markers]);
  const showClusters = clusters.length > 1 && zoom < CLUSTER_ZOOM_THRESHOLD;

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
    if (unmatched.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
          <p className="text-slate-400 text-sm font-bold">
            ไม่พบพิกัดของพื้นที่ที่เคยเกิดอุทกภัย
          </p>
          <ul className="text-xs text-slate-500 list-disc pl-4 text-left">
            {buildUnmatchedListItems(unmatched, districtLabel, subdistrictLabel)}
          </ul>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
        ไม่พบพิกัดของพื้นที่ที่เคยเกิดอุทกภัย
      </div>
    );
  }

  const mapMarkerElements = [];
  if (showClusters) {
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      mapMarkerElements.push(
        <CircleMarker
          key={cluster.district}
          center={[cluster.lat, cluster.lon]}
          radius={getRadius(cluster.mooCount) + 2}
          pathOptions={{
            color: '#ffffff',
            weight: 1.5,
            fillColor: COLOR_CLUSTER,
            fillOpacity: 0.8,
          }}
          eventHandlers={{
            // แตะกลุ่มแล้วซูมเข้าไปจนแยกเห็นหมุดตำบลทีละจุด
            click: (event) => {
              event.target._map.flyTo([cluster.lat, cluster.lon], ZOOM_ON_CLUSTER_CLICK);
            },
          }}
        >
          <Popup>
            <div className="text-[13px] leading-relaxed">
              <div className="font-bold text-slate-800">{districtLabel}{cluster.district}</div>
              <div className="mt-1 text-slate-700">
                {cluster.tambonCount} {subdistrictLabel}ที่เคยมีรายงานในเดือนนี้
              </div>
              <div className="mt-1 text-slate-400 text-[11px]">แตะเพื่อซูมดูราย{subdistrictLabel}</div>
            </div>
          </Popup>
        </CircleMarker>
      );
    }
  } else {
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];

      let markerColor;
      if (marker.level === 'tambon') {
        markerColor = COLOR_TAMBON;
      } else {
        markerColor = COLOR_DISTRICT_FALLBACK;
      }

      mapMarkerElements.push(
        <CircleMarker
          key={marker.key}
          center={[marker.lat, marker.lon]}
          radius={getRadius(countMoo(marker.mooText))}
          pathOptions={{
            color: '#ffffff',
            weight: 1.5,
            fillColor: markerColor,
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
                {subdistrictLabel}{marker.subdistrict}
              </div>
              <div className="text-slate-500">{districtLabel}{marker.district}</div>
              <div className="mt-1 text-slate-700">{marker.mooText}</div>
              <div className="mt-1 text-slate-400 text-[11px]">
                ปีที่เคยมีรายงาน {buildYearsText(marker.years)}
              </div>
              {marker.level === 'district' && (
                <div className="mt-1 text-amber-600 text-[11px]">
                  แสดงที่จุดกลาง{districtLabel} เพราะไม่พบพิกัดของ{subdistrictLabel}นี้
                </div>
              )}
              <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-slate-400 text-[11px]">
                หมุดอยู่ที่จุดกลาง{subdistrictLabel} ไม่ใช่ตำแหน่งของหมู่ และไม่ใช่ขอบเขตน้ำท่วมจริง
              </div>
            </div>
          </Popup>
        </CircleMarker>
      );
    }
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
      <ZoomWatcher onZoomChange={setZoom} />
      <UnmatchedNotice unmatched={unmatched} districtLabel={districtLabel} subdistrictLabel={subdistrictLabel} />

      {mapMarkerElements}
    </MapContainer>
  );
}
