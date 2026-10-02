import 'server-only';
import pool from '@/lib/db';
import { getCached, TEN_MINUTES } from '@/lib/cache';
import { REAL_DATA_YEARS } from '@/lib/prediction';

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
      f.generated_at,
      c.baseline_mean,
      n.precipitation_days AS normal_rain_days

    FROM rainfall_forecast f

    LEFT JOIN rainfall_climate_normals c
      ON TRIM(f.province) = TRIM(c.province)
      AND f.month = c.month

    LEFT JOIN province_climate_normals n
      ON TRIM(f.province) = TRIM(n.province)
      AND f.month = n.month

    ORDER BY f.province, f.year, f.month
  `);


 
  const years = [];

  for (let i = 0; i < forecastRows.length; i++) {
    const year = forecastRows[i].year;

    if (!years.includes(year)) {
      years.push(year);
    }
  }



  const [normalRows] = await pool.query(`
    SELECT
      province,
      month,
      baseline_mean

    FROM rainfall_climate_normals

    ORDER BY province, month
  `);


  // =====================
  // ข้อมูลฝนจริงของปีที่ศึกษา (REAL_DATA_YEARS) ทุกจังหวัด
  // ใช้เทียบปริมาณฝนพยากรณ์กับปีที่เคยมีรายงานอุทกภัยในเดือนเดียวกัน
  // =====================
  let historyPlaceholders = '?';

  for (let i = 1; i < REAL_DATA_YEARS.length; i++) {
    historyPlaceholders += ',?';
  }

  const [historyRows] = await pool.query(
    `
    SELECT
      r.province,
      r.year,
      r.month,
      r.average_rain

    FROM rainfall_monthly r

    WHERE r.year IN (${historyPlaceholders})
      AND r.average_rain IS NOT NULL

    ORDER BY r.province, r.year, r.month
    `,
    REAL_DATA_YEARS
  );


  // ถ้าไม่มีข้อมูลพยากรณ์
  if (years.length === 0) {
    return {
      forecastRows: forecastRows,
      actualRows: [],
      normalRows: normalRows,
      historyRows: historyRows,
    };
  }


  // =====================
  // 3. สร้าง ? สำหรับ SQL
  // =====================
  let placeholders = '?';

  for (let i = 1; i < years.length; i++) {
    placeholders += ',?';
  }


 
  // 4. ดึงข้อมูลฝนจริงของปีเดียวกับที่พยากรณ์

  const [actualRows] = await pool.query(
    `
    SELECT
      r.province,
      r.year,
      r.month,
      r.average_rain,
      c.baseline_mean

    FROM rainfall_monthly r

    LEFT JOIN rainfall_climate_normals c
      ON TRIM(r.province) = TRIM(c.province)
      AND r.month = c.month

    WHERE r.year IN (${placeholders})
      AND r.average_rain IS NOT NULL

    ORDER BY r.province, r.year, r.month
    `,
    years
  );



  return {
    forecastRows: forecastRows,
    actualRows: actualRows,
    normalRows: normalRows,
    historyRows: historyRows,
  };
}

export async function getAllForecastData() {
  return getCached('forecast', TEN_MINUTES, loadForecastData);
}
