// lib/data/trends.js
import 'server-only';
import pool from "@/lib/db";
import { unstable_cache } from 'next/cache';

async function fetchSearchTrends() {
  const sql = `
    SELECT 
      TRIM(province) AS province,
      year,
      month,
      COALESCE(search_flood, 0) AS search_flood,
      COALESCE(search_rain, 0) AS search_rain,
      COALESCE(search_storm, 0) AS search_storm,
      COALESCE(search_water_level, 0) AS search_water_level,
      COALESCE(search_water_situation, 0) AS search_water_situation,
      COALESCE(search_evacuate, 0) AS search_evacuate
    FROM search_trends
    ORDER BY year DESC, month ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

export const getSearchTrends = unstable_cache(
  async () => fetchSearchTrends(),
  ['search-trends-cache'],
  { revalidate: 3600 }
);
