import 'server-only';
import pool from "@/lib/db";
import { unstable_cache } from 'next/cache';

async function fetchRainfallData() {
  const sql = `
    SELECT
      r.idrainfall_monthly,
      TRIM(r.province) AS province,
      r.year,
      r.month,
      r.average_rain,
      c.baseline_mean
    FROM rainfall_monthly r
    LEFT JOIN rainfall_climate_normals c
      ON TRIM(r.province) = TRIM(c.province)
      AND r.month = c.month
    ORDER BY r.year DESC, r.month ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

export const getRainfallData = unstable_cache(
  fetchRainfallData,
  ['rainfall-data-cache'],
  { revalidate: 3600 }
);
