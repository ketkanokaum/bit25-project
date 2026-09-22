import 'server-only';
import pool from "@/lib/db";
import { getCached, TEN_MINUTES } from "@/lib/cache";

async function fetchSearchTrends() {
  const sql = `
    SELECT
      TRIM(province) AS province,
      year,
      month,
      search_flood,
      search_rain,
      search_storm,
      search_water_level,
      search_water_situation,
      search_evacuate
    FROM search_trends
    ORDER BY year DESC, month ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

export async function getSearchTrends() {
  return getCached("search-trends", TEN_MINUTES, fetchSearchTrends);
}
