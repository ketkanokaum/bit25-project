import 'server-only';
import { provinceRegions } from '@/lib/constants/provinces';
import { getCached, TEN_MINUTES } from '@/lib/cache';

const TODAY_RAIN_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_today';

async function fetchStations(url) {
  // API ภายนอกบางครั้งตอบช้ามาก (เคยวัดได้เกิน 19 วินาที) จึงกำหนดเวลารอสูงสุดไว้
  // ไม่ให้คำขอค้างรอไม่สิ้นสุด
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(25000) });

  if (!res.ok) {
    throw new Error(`thaiwater API HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data || [];
}

function getBangkokToday() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const bangkok = new Date(utcMs + 7 * 60 * 60 * 1000);

  const year = bangkok.getFullYear();
  const month = String(bangkok.getMonth() + 1).padStart(2, '0');
  const day = String(bangkok.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStationName(station) {
  const info = station.station;
  if (!info) return null;

  const name = info.tele_station_name;
  if (!name) return null;

  if (name.th) return name.th;
  if (name.en) return name.en;

  return null;
}

function summarizeTodayStations(stations, today) {
  const byProvince = {};

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];

    const province =
      station.geocode &&
      station.geocode.province_name &&
      station.geocode.province_name.th;

    if (!province || !(province in provinceRegions)) continue;

    const readingTime = station.rainfall_datetime || '';
    if (readingTime.slice(0, 10) !== today) continue;

    const value = Number(station.rainfall_value);
    if (Number.isNaN(value)) continue;

    const stationName = getStationName(station);

    if (!byProvince[province]) {
      byProvince[province] = {
        sum: 0,
        count: 0,
        max: value,
        maxStation: stationName,
        latestTime: readingTime,
        stations: []
      };
    }

    byProvince[province].sum += value;
    byProvince[province].count += 1;

    byProvince[province].stations.push({
      id: String(station.station.id),
      name: stationName || 'ไม่ระบุชื่อสถานี',
      rainfall: value
    });

    if (value > byProvince[province].max) {
      byProvince[province].max = value;
      byProvince[province].maxStation = stationName;
    }

    if (readingTime > byProvince[province].latestTime) {
      byProvince[province].latestTime = readingTime;
    }
  }

  const result = {};

  for (const province in byProvince) {
    const entry = byProvince[province];

    result[province] = {
      average: entry.sum / entry.count,
      max: entry.max,
      maxStation: entry.maxStation,
      stationCount: entry.count,
      latestTime: entry.latestTime,
      date: today,
      stations: entry.stations
    };
  }

  return result;
}

export async function getTodayRainfallByProvince() {
  const today = getBangkokToday();

  return getCached(`today-rain-${today}`, TEN_MINUTES, async () => {
    const stations = await fetchStations(TODAY_RAIN_URL);
    return summarizeTodayStations(stations, today);
  });
}
