import 'server-only';
import pool from '@/lib/db';
import { getCached, TEN_MINUTES } from '@/lib/cache';

async function loadForecastData() {




  const [forecastRows] = await pool.query(`
    SELECT
      f.province,
      f.year,
      f.month,
      f.predicted_rain,
      f.predicted_rain_lower,
      f.predicted_rain_upper,
      f.horizon_months,
      f.generated_at

    FROM rainfall_forecast f

    ORDER BY f.province, f.year, f.month
  `);



  const years = [];

  for (let i = 0; i < forecastRows.length; i++) {
    const year = forecastRows[i].year;

    if (!years.includes(year)) {
      years.push(year);
    }
  }


  // ถ้าไม่มีข้อมูลพยากรณ์
  if (years.length === 0) {
    return {
      forecastRows: forecastRows,
      actualRows: [],
    };
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
