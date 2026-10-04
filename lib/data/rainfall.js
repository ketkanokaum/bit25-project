import 'server-only';
import pool from "@/lib/db";
import { getCached, TEN_MINUTES } from "@/lib/cache";

async function fetchRainfallData() {
  const sql = `
    SELECT
      r.idrainfall_monthly,
      TRIM(r.province) AS province,
      r.year,
      r.month,
      r.average_rain
    FROM rainfall_monthly r
    ORDER BY r.year DESC, r.month ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

export async function getRainfallData() {
  return getCached("rainfall-monthly", TEN_MINUTES, fetchRainfallData);
}