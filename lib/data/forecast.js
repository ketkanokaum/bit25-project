import 'server-only';
import pool from '@/lib/db';
import { getCached, TEN_MINUTES } from '@/lib/cache';

async function loadForecastData() {


  // 1. ดึงข้อมูลพยากรณ์

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


  // =====================
  // 2. หาปีที่มีข้อมูลพยากรณ์
  // =====================
  const years = [];

  for (let i = 0; i < forecastRows.length; i++) {
    const year = forecastRows[i].year;

    if (!years.includes(year)) {
      years.push(year);
    }
  }


  // ค่าปกติครบ 12 เดือนของทุกจังหวัด ใช้ทำเส้นค่าปกติในกราฟ
  // และหาว่าเดือนที่เลือกเป็นเดือนฝนมากอันดับที่เท่าไรของจังหวัดนั้น
  const [normalRows] = await pool.query(`
    SELECT
      province,
      month,
      baseline_mean

    FROM rainfall_climate_normals

    ORDER BY province, month
  `);


  // ถ้าไม่มีข้อมูลพยากรณ์
  if (years.length === 0) {
    return {
      forecastRows: forecastRows,
      actualRows: [],
      normalRows: normalRows,
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

    ORDER BY r.province, r.year, r.month
    `,
    years
  );


 
  return {
    forecastRows: forecastRows,
    actualRows: actualRows,
    normalRows: normalRows,
  };
}

export async function getAllForecastData() {
  return getCached('forecast', TEN_MINUTES, loadForecastData);
}
