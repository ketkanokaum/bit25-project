import 'server-only';
import { provinceRegions } from '@/lib/constants/provinces';

const BASE_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public';

const ENDPOINTS = {
  today: `${BASE_URL}/rain_today`,
  yesterday: `${BASE_URL}/rain_yesterday`,
  monthly: `${BASE_URL}/rain_monthly`,
  yearly: `${BASE_URL}/rain_yearly`,
};

async function fetchStations(url) {
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`thaiwater API HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data || [];
}

function aggregateByProvince(stations) {
  const byProvince = {};

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];

    const province =
      station.geocode &&
      station.geocode.province_name &&
      station.geocode.province_name.th;

    if (!province || !(province in provinceRegions)) continue;

    const value = Number(station.rainfall_value);
    if (Number.isNaN(value)) continue;

    if (!byProvince[province]) {
      byProvince[province] = {
        sum: 0,
        count: 0
      };
    }

    byProvince[province].sum += value;
    byProvince[province].count += 1;
  }

  const result = {};

  for (const province in byProvince) {
    const entry = byProvince[province];

    result[province] = {
      average: entry.sum / entry.count,
      stationCount: entry.count
    };
  }

  return result;
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
      name: stationName,
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
  const stations = await fetchStations(ENDPOINTS.today);

  return summarizeTodayStations(stations, today);
}

const CACHE_TTL_MS = 10 * 60 * 1000;

let cache = {
  data: null,
  fetchedAt: 0
};

export async function getLiveRainfallByProvince() {
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const rows = await fetchAndAggregate();

  cache = {
    data: rows,
    fetchedAt: Date.now()
  };

  return rows;
}

async function fetchAndAggregate() {
  const entries = Object.entries(ENDPOINTS);

  const settled = await Promise.allSettled(
    entries.map(([, url]) => fetchStations(url))
  );

  const aggregated = {};

  for (let i = 0; i < entries.length; i++) {
    const key = entries[i][0];
    const outcome = settled[i];

    if (outcome.status === 'fulfilled') {
      aggregated[key] = aggregateByProvince(outcome.value);
    } else {
      aggregated[key] = {};
    }
  }

  const provinces = Object.keys(provinceRegions);
  const rows = [];

  for (let i = 0; i < provinces.length; i++) {
    const province = provinces[i];

    rows.push({
      province: province,
      today: aggregated.today[province] || null,
      yesterday: aggregated.yesterday[province] || null,
      monthly: aggregated.monthly[province] || null,
      yearly: aggregated.yearly[province] || null
    });
  }

  return rows;
}