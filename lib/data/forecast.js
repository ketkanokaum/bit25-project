import 'server-only';
import pool from '@/lib/db';
import { getCached, setCached, TEN_MINUTES, THIRTY_SECONDS } from '@/lib/cache';
import { fetchForecastFromModel, getModelApiUrl } from '@/lib/data/model-api';
import { buildForecastRows } from '@/lib/data/forecast-table';

const FORECAST_CACHE_KEY = 'forecast';

let modelRefreshing = false;

async function loadLastActualPeriod() {
  const [rows] = await pool.query(`
    SELECT r.year, r.month
    FROM rainfall_monthly r
    WHERE r.average_rain IS NOT NULL
    ORDER BY r.year DESC, r.month DESC
    LIMIT 1
  `);
  if (rows.length === 0) return null;
  return { year: Number(rows[0].year), month: Number(rows[0].month) };
}

async function loadActualRows(forecastRows) {
  const years = [];

  for (let i = 0; i < forecastRows.length; i++) {
    const year = forecastRows[i].year;

    if (!years.includes(year)) {
      years.push(year);
    }
  }

  if (years.length === 0) return [];

  let earliestYear = years[0];

  for (let i = 1; i < years.length; i++) {
    if (years[i] < earliestYear) {
      earliestYear = years[i];
    }
  }

  if (!years.includes(earliestYear - 1)) {
    years.push(earliestYear - 1);
  }

  let placeholders = '?';

  for (let i = 1; i < years.length; i++) {
    placeholders += ',?';
  }

  const [actualRows] = await pool.query(
    `
    SELECT
      r.province,
      r.year,
      r.month,
      r.average_rain

    FROM rainfall_monthly r

    WHERE r.year IN (${placeholders})
      AND r.average_rain IS NOT NULL

    ORDER BY r.province, r.year, r.month
    `,
    years
  );

  return actualRows;
}

async function buildPayload(forecastRows) {
  const actualRows = await loadActualRows(forecastRows);
  return { forecastRows: forecastRows, actualRows: actualRows };
}

async function refreshFromModel(lastActual) {
  if (modelRefreshing) return;
  modelRefreshing = true;

  try {
    const rows = await fetchForecastFromModel(lastActual.year, lastActual.month);
    if (rows && rows.length > 0) {
      setCached(FORECAST_CACHE_KEY, await buildPayload(rows));
    }
  } catch (error) {
    console.error('อัปเดตค่าพยากรณ์จากแบบจำลองไม่สำเร็จ: ' + error.message);
  } finally {
    modelRefreshing = false;
  }
}

async function loadForecastData() {
  const lastActual = await loadLastActualPeriod();

  if (!lastActual) {
    console.error('ไม่พบเดือนล่าสุดที่มีข้อมูลฝนจริง จึงไม่มีค่าพยากรณ์');
    return { forecastRows: [], actualRows: [] };
  }

  if (getModelApiUrl()) {
    refreshFromModel(lastActual);
  } else {
    console.error('ยังไม่ได้ตั้งค่า MODEL_API_URL');
  }

  return buildPayload(buildForecastRows(lastActual.year, lastActual.month));
}

function hasNoForecast(data) {
  return !data || data.forecastRows.length === 0;
}

export async function getAllForecastData() {
  return getCached(FORECAST_CACHE_KEY, TEN_MINUTES, loadForecastData, {
    isIncomplete: hasNoForecast,
    incompleteMaxAgeMs: THIRTY_SECONDS,
  });
}
