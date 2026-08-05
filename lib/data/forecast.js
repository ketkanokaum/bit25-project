// lib/data/forecast.js
import 'server-only';
import pool from "@/lib/db";
import { unstable_cache } from 'next/cache';


async function fetchAllForecast() {
  const [forecastRows] = await pool.query(
    `SELECT f.province, f.year, f.month,
            f.predicted_rain, f.predicted_rain_lower, f.predicted_rain_upper,
            f.horizon_months, f.generated_at,
            c.baseline_mean
     FROM rainfall_forecast f
     LEFT JOIN rainfall_climate_normals c
       ON TRIM(f.province) = TRIM(c.province) AND f.month = c.month
     ORDER BY f.province, f.year, f.month`
  );

  // ข้อมูลจริงเฉพาะปีที่มีค่าพยากรณ์อยู่ (ไม่ต้องดึงทั้ง 2561-2569 มาเปล่าๆ)
  const years = [...new Set(forecastRows.map((r) => r.year))];
  let actualRows = [];
  if (years.length > 0) {
    const placeholders = years.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT r.province, r.year, r.month, r.average_rain, c.baseline_mean
       FROM rainfall_monthly r
       LEFT JOIN rainfall_climate_normals c
         ON TRIM(r.province) = TRIM(c.province) AND r.month = c.month
       WHERE r.year IN (${placeholders})
       ORDER BY r.province, r.year, r.month`,
      years
    );
    actualRows = rows;
  }

  return { forecastRows, actualRows };
}

export const getAllForecastData = unstable_cache(
  fetchAllForecast,
  ['forecast-all'],
  { revalidate: 3600 }
);