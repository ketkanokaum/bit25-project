import 'server-only';
import pool from '@/lib/db';
import { getCached, TEN_MINUTES } from '@/lib/cache';
import { fetchForecastFromModel, getModelApiUrl } from '@/lib/data/model-api';

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

async function loadForecastData() {

  let forecastRows = null;

  if (getModelApiUrl()) {
    const lastActual = await loadLastActualPeriod();
    if (lastActual) {
      forecastRows = await fetchForecastFromModel(lastActual.year, lastActual.month);
    }
  } else {
    console.error('ยังไม่ได้ตั้งค่า MODEL_API_URL จึงไม่มีค่าพยากรณ์');
  }

  if (!forecastRows) {
    forecastRows = [];
  }

  const years = [];

  for (let i = 0; i < forecastRows.length; i++) {
    const year = forecastRows[i].year;

    if (!years.includes(year)) {
      years.push(year);
    }
  }

  if (years.length === 0) {
    return {
      forecastRows: forecastRows,
      actualRows: [],
    };
  }

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

  return {
    forecastRows: forecastRows,
    actualRows: actualRows,
  };
}

export async function getAllForecastData() {
  return getCached('forecast', TEN_MINUTES, loadForecastData);
}
