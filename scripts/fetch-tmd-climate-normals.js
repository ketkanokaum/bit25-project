#!/usr/bin/env node
/**
 * Build per-province monthly climate normals from the Thai Meteorological
 * Department's own official Open Data API (data.tmd.go.th) — replaces the
 * Open-Meteo-derived version of province_climate_normals with genuine TMD
 * ground-station data, at the user's request for a Thailand-sourced normal.
 *
 * Endpoints used (all confirmed working with TMD's public demo credentials
 * uid=api&ukey=api12345 — see data.tmd.go.th/api/ for the full catalog and
 * data.tmd.go.th/api/registerFrm.php to register a personal key for
 * production use instead of the shared demo one):
 *
 *   - ThailandClimateNormal: official 30-year normal, 1981-2010, 124
 *     stations. Gives Mean Dry-bulb / Min / Max Temperature, Mean Relative
 *     Humidity, Total Rainfall — monthly. Has NO sunshine or wind element,
 *     and no Province field (only station name + lat/lon).
 *   - ThailandMonthlyRainfall: actual monthly rainfall + rainy-day counts
 *     per station per year, 2001-present (has Province directly). Used
 *     here to compute a "normal rain days" figure the same way Open-Meteo
 *     climate normals are computed elsewhere in this repo — average of
 *     each year's monthly value across the reference years, not a single
 *     flat pool of days. Reference years: 2001-2020 (earliest available
 *     year on this endpoint through 2020, to roughly bracket the same
 *     window as the 1981-2010 normal's later end).
 *   - WeatherToday: used only to map ThailandClimateNormal's station names
 *     to a Thai province name (that endpoint has Province directly; this
 *     one does not), and as a coordinate source for the nearest-station
 *     fallback below.
 *
 * Province coverage & fallback: ThailandClimateNormal covers ~65/77
 * provinces via direct station-name-to-province matching. For the
 * remaining provinces, this script geocodes the province (Open-Meteo
 * geocoding API — a coordinate lookup only, not weather data) and assigns
 * it the nearest ThailandClimateNormal station's values by straight-line
 * distance. This is disclosed here for transparency: those provinces'
 * "normal" is actually their nearest official station's normal, not a
 * station within the province itself.
 *
 * No sunshine_hours / wind_speed_max columns: TMD's public API does not
 * expose these as normals, so they are omitted from the table entirely
 * (the UI already renders that card's tiles conditionally and simply
 * omits a tile with no data).
 *
 * Reference period is fixed at 1981-2010 for every row (TMD's published
 * 30-year normal) — documented here rather than as a per-row DB column
 * since it never varies.
 *
 * Attribution: Thai Meteorological Department (TMD) Open Data API,
 * https://data.tmd.go.th — see data.tmd.go.th/api/ for terms.
 *
 * Usage:
 *   node scripts/fetch-tmd-climate-normals.js --dry-run
 *   node scripts/fetch-tmd-climate-normals.js
 *   node scripts/fetch-tmd-climate-normals.js --province เชียงใหม่
 *
 * Every real run (and dry-run) also writes a CSV snapshot of the computed
 * rows to scripts/output/province-climate-normals-tmd.csv by default —
 * this is the exportable intermediate artifact, matching the CSV-based
 * data flow used for the project's other sources (Google Trends, HII,
 * DDPM). Override the path with --csv <path>, or skip it with --no-csv.
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { PROVINCE_EN_NAME, ALL_PROVINCES } = require("./lib/thai-provinces");
const { loadEnvLocal } = require("./lib/env");
const { fetchWithRetry } = require("./lib/http");
loadEnvLocal();

const TMD_UID = process.env.TMD_API_UID || "api";
const TMD_UKEY = process.env.TMD_API_UKEY || "api12345";
const TMD_BASE = "https://data.tmd.go.th/api";

const RAINFALL_YEARS = [];
for (let y = 2001; y <= 2020; y++) RAINFALL_YEARS.push(y);

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_ABBR3 = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// Each TMD endpoint pins its own API version in the URL path, and it's not
// uniformly "v1" — WeatherToday is only served at V2 (confirmed: the v1
// path for it doesn't 404, it just hangs/never resolves).
const TMD_ENDPOINT_VERSION = {
  WeatherToday: "V2",
};

async function tmdGet(endpoint, extraParams) {
  const version = TMD_ENDPOINT_VERSION[endpoint] || "v1";
  const params = new URLSearchParams({ uid: TMD_UID, ukey: TMD_UKEY, format: "json", ...extraParams });
  const res = await fetchWithRetry(`${TMD_BASE}/${endpoint}/${version}/?${params}`);
  if (!res.ok) throw new Error(`TMD ${endpoint} HTTP ${res.status}`);
  return res.json();
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function geocodeProvince(thaiName) {
  const queryName = PROVINCE_EN_NAME[thaiName] || thaiName;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryName)}&count=5&language=en&format=json`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`geocoding HTTP ${res.status}`);
  const json = await res.json();
  const results = json.results || [];
  const thMatch = results.find((r) => r.country_code === "TH");
  const picked = thMatch || results[0];
  if (!picked) throw new Error("no geocoding result");
  return { lat: picked.latitude, lon: picked.longitude };
}

// ---------- Step 1: ThailandClimateNormal (temp/humidity/rainfall, 1981-2010) ----------
async function fetchClimateNormalByStation() {
  const json = await tmdGet("ThailandClimateNormal");
  const rows = json.StationClimateNormal || [];

  const byStation = {}; // stationName -> { lat, lon, elements: { elementName: [12 monthly values] } }
  for (const row of rows) {
    const name = row.StationName;
    if (!byStation[name]) {
      byStation[name] = { lat: Number(row.Latitude), lon: Number(row.Longitude), elements: {} };
    }
    const values = MONTH_NAMES_EN.map((m) => {
      const v = row.NormalValue[`ValueOn${m}`];
      // TMD serializes a missing reading as an empty object ({}), not a
      // missing key or empty string — Number({}) is NaN, so catch it here.
      if (v == null || v === "" || typeof v === "object") return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    });
    byStation[name].elements[row.NormalValue.Element] = values;
  }
  return byStation;
}

// ---------- Step 2: WeatherToday (station -> province + coordinates) ----------
async function fetchStationProvinceMap() {
  const json = await tmdGet("WeatherToday");
  const stations = json.Stations.Station;
  const map = {}; // stationNameEnglish -> { province, lat, lon }
  for (const s of stations) {
    map[s.StationNameEnglish] = {
      province: s.Province,
      lat: Number(s.Latitude),
      lon: Number(s.Longitude),
    };
  }
  return map;
}

// ---------- Step 3: ThailandMonthlyRainfall across years (rain-days normal) ----------
async function fetchRainDaysByProvince(dryRun) {
  const byProvinceMonth = {}; // province -> month(1-12) -> array of yearly rain-day counts
  for (let m = 1; m <= 12; m++) {
    // pre-fill below per province as encountered
  }

  for (const year of RAINFALL_YEARS) {
    if (dryRun && year !== RAINFALL_YEARS[RAINFALL_YEARS.length - 1]) {
      // in dry-run, only pull the most recent year to keep the preview fast
      continue;
    }
    const json = await tmdGet("ThailandMonthlyRainfall", { year: String(year) });
    const rows = json.StationMonthlyRainfall || [];
    for (const row of rows) {
      const province = row.Province;
      if (!province) continue;
      if (!byProvinceMonth[province]) {
        byProvinceMonth[province] = {};
        for (let m = 1; m <= 12; m++) byProvinceMonth[province][m] = [];
      }
      for (let m = 1; m <= 12; m++) {
        const v = row.MonthlyRainyDay[`RainyDay${MONTH_ABBR3[m - 1]}`];
        if (v != null && v !== "") {
          byProvinceMonth[province][m].push(Number(v));
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return byProvinceMonth;
}

function average(values) {
  // TMD occasionally uses a non-numeric placeholder for a missing reading,
  // which Number(...) turns into NaN rather than null — filter it out here
  // so it never reaches the DB (mysql2 chokes on binding a literal NaN).
  const clean = values.filter((v) => v != null && !Number.isNaN(v));
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

function round2(n) {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n * 100) / 100;
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS province_climate_normals (
    idprovince_climate_normals INT AUTO_INCREMENT PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    month INT NOT NULL,
    temp_mean DECIMAL(5,2),
    temp_min DECIMAL(5,2),
    temp_max DECIMAL(5,2),
    precipitation_mm DECIMAL(7,2),
    precipitation_days DECIMAL(5,2),
    humidity_mean DECIMAL(5,2)
  )
`;

async function upsertClimateNormal(pool, province, month, values) {
  const [existing] = await pool.query(
    "SELECT idprovince_climate_normals FROM province_climate_normals WHERE TRIM(province) = ? AND month = ? LIMIT 1",
    [province, month]
  );
  const params = [
    values.temp_mean, values.temp_min, values.temp_max,
    values.precipitation_mm, values.precipitation_days,
    values.humidity_mean,
  ];
  if (existing.length > 0) {
    await pool.query(
      `UPDATE province_climate_normals SET
        temp_mean = ?, temp_min = ?, temp_max = ?,
        precipitation_mm = ?, precipitation_days = ?, humidity_mean = ?
      WHERE idprovince_climate_normals = ?`,
      [...params, existing[0].idprovince_climate_normals]
    );
  } else {
    await pool.query(
      `INSERT INTO province_climate_normals
        (province, month, temp_mean, temp_min, temp_max, precipitation_mm, precipitation_days, humidity_mean)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [province, month, ...params]
    );
  }
}

const DEFAULT_CSV_PATH = path.join(__dirname, "output", "province-climate-normals-tmd.csv");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { provinces: [], dryRun: false, csvPath: DEFAULT_CSV_PATH, noCsv: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--province") opts.provinces.push(args[++i]);
    else if (args[i] === "--dry-run") opts.dryRun = true;
    else if (args[i] === "--csv") opts.csvPath = args[++i];
    else if (args[i] === "--no-csv") opts.noCsv = true;
  }
  if (opts.provinces.length === 0) opts.provinces = ALL_PROVINCES;
  return opts;
}

const CSV_COLUMNS = [
  "province", "month", "temp_mean", "temp_min", "temp_max",
  "precipitation_mm", "precipitation_days", "humidity_mean",
];

function toCsvValue(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeCsv(csvPath, rows) {
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map((col) => toCsvValue(row[col])).join(","));
  }
  // Leading BOM so Excel opens the Thai province names correctly instead of mojibake.
  fs.writeFileSync(csvPath, "﻿" + lines.join("\n") + "\n", "utf8");
}

async function main() {
  const opts = parseArgs();

  console.log("Fetching ThailandClimateNormal (temp/humidity/rainfall, 1981-2010)...");
  const climateByStation = await fetchClimateNormalByStation();

  console.log("Fetching WeatherToday (station -> province map)...");
  const stationProvinceMap = await fetchStationProvinceMap();

  console.log(`Fetching ThailandMonthlyRainfall for rain-days normal (${RAINFALL_YEARS[0]}-${RAINFALL_YEARS[RAINFALL_YEARS.length - 1]})${opts.dryRun ? " [dry-run: latest year only]" : ""}...`);
  const rainDaysByProvinceMonth = await fetchRainDaysByProvince(opts.dryRun);

  // Build province -> [{ lat, lon, elements }] from matched stations
  const stationsByProvince = {};
  const matchedStationCoords = []; // for nearest-fallback search
  for (const [stationName, data] of Object.entries(climateByStation)) {
    const mapped = stationProvinceMap[stationName];
    const entry = { lat: data.lat, lon: data.lon, elements: data.elements, stationName };
    // Some stations (agromet, etc.) only report a subset of elements —
    // exclude them from the nearest-station fallback pool so a fallback
    // province never lands on a station missing the core temp/humidity
    // reading (it can still be used directly when it IS the matched
    // in-province station, just not offered up as someone else's fallback).
    const tempValues = data.elements["Mean Dry-bulb Temperature"];
    if (tempValues && tempValues.some((v) => v != null)) {
      matchedStationCoords.push(entry);
    }
    if (mapped) {
      if (!stationsByProvince[mapped.province]) stationsByProvince[mapped.province] = [];
      stationsByProvince[mapped.province].push(entry);
    }
  }

  let pool = null;
  if (!opts.dryRun) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: "utf8mb4",
      ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
    });
    await pool.query(CREATE_TABLE_SQL);
  }

  const csvRows = [];

  for (const province of opts.provinces) {
    try {
      let stations = stationsByProvince[province];
      let usedFallback = false;

      if (!stations || stations.length === 0) {
        // Nearest-station fallback: geocode the province, find closest matched station.
        const { lat, lon } = await geocodeProvince(province);
        let nearest = null;
        let nearestDist = Infinity;
        for (const s of matchedStationCoords) {
          const d = haversineKm(lat, lon, s.lat, s.lon);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = s;
          }
        }
        if (!nearest) throw new Error("no TMD station available at all");
        stations = [nearest];
        usedFallback = true;
      }

      for (let month = 1; month <= 12; month++) {
        const tempMean = average(
          stations.map((s) => s.elements["Mean Dry-bulb Temperature"]?.[month - 1]).filter((v) => v != null)
        );
        const tempMin = average(
          stations.map((s) => s.elements["Mean Minimum Temperature"]?.[month - 1]).filter((v) => v != null)
        );
        const tempMax = average(
          stations.map((s) => s.elements["Mean Maximum Temperature"]?.[month - 1]).filter((v) => v != null)
        );
        const humidity = average(
          stations.map((s) => s.elements["Mean Relative Humidity"]?.[month - 1]).filter((v) => v != null)
        );
        const rainfall = average(
          stations.map((s) => s.elements["Total Rainfall"]?.[month - 1]).filter((v) => v != null)
        );

        const rainDaysList = rainDaysByProvinceMonth[province]?.[month] || [];
        const rainDays = average(rainDaysList);

        const values = {
          temp_mean: round2(tempMean),
          temp_min: round2(tempMin),
          temp_max: round2(tempMax),
          precipitation_mm: round2(rainfall),
          precipitation_days: round2(rainDays),
          humidity_mean: round2(humidity),
        };

        csvRows.push({ province, month, ...values });

        if (opts.dryRun) {
          console.log(
            `  [dry-run]${usedFallback ? " (nearest-station)" : ""} ${province} เดือน ${month}: temp ${values.temp_min}-${values.temp_max}°C (avg ${values.temp_mean}), rain ${values.precipitation_mm}mm/${values.precipitation_days}d, humidity ${values.humidity_mean}%`
          );
        } else {
          await upsertClimateNormal(pool, province, month, values);
        }
      }

      console.log(`✓ ${province}${usedFallback ? ` (ใช้สถานีใกล้ที่สุด: ${stations[0].stationName})` : ` (${stations.length} สถานี)`}`);
    } catch (err) {
      console.error(`✗ ${province}: ${err.message}`);
    }
  }

  if (pool) await pool.end();

  if (!opts.noCsv && csvRows.length > 0) {
    writeCsv(opts.csvPath, csvRows);
    console.log(`Exported ${csvRows.length} rows -> ${opts.csvPath}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
