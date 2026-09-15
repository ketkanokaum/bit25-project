import 'server-only';
import { provinceRegions } from '@/lib/constants/provinces';

// Public, no-auth REST API behind thaiwater.net / ntw.onwr.go.th's own map layers.
// Each record is one physical rain gauge station with a rainfall_value (mm) and a
// geocode.province_name — real station readings, not a forecast or a modeled average.
const BASE_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public';

const ENDPOINTS = {
  today: `${BASE_URL}/rain_today`,
  yesterday: `${BASE_URL}/rain_yesterday`,
  monthly: `${BASE_URL}/rain_monthly`,
  yearly: `${BASE_URL}/rain_yearly`,
};

async function fetchStations(url) {

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`thaiwater API HTTP ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

function aggregateByProvince(stations) {
  const byProvince = {};
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const province = s.geocode && s.geocode.province_name && s.geocode.province_name.th;
    if (!province || !(province in provinceRegions)) continue;

    const value = Number(s.rainfall_value);
    if (Number.isNaN(value)) continue;

    if (!byProvince[province]) byProvince[province] = { sum: 0, count: 0 };
    byProvince[province].sum += value;
    byProvince[province].count += 1;
  }

  const result = {};
  for (const province in byProvince) {
    const { sum, count } = byProvince[province];
    result[province] = { average: sum / count, stationCount: count };
  }
  return result;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { data: null, fetchedAt: 0 };

export async function getLiveRainfallByProvince() {
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const rows = await fetchAndAggregate();
  cache = { data: rows, fetchedAt: Date.now() };
  return rows;
}

async function fetchAndAggregate() {
  const entries = Object.entries(ENDPOINTS);
  const settled = await Promise.allSettled(
    entries.map(([, url]) => fetchStations(url))
  );

  const aggregated = {};
  for (let i = 0; i < entries.length; i++) {
    const [key] = entries[i];
    const outcome = settled[i];
    aggregated[key] = outcome.status === 'fulfilled' ? aggregateByProvince(outcome.value) : {};
  }

  const provinces = Object.keys(provinceRegions);
  const rows = [];
  for (let i = 0; i < provinces.length; i++) {
    const province = provinces[i];
    rows.push({
      province,
      today: aggregated.today[province] || null,
      yesterday: aggregated.yesterday[province] || null,
      monthly: aggregated.monthly[province] || null,
      yearly: aggregated.yearly[province] || null,
    });
  }

  return rows;
}
