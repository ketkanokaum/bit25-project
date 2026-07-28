// lib/data/flood.js
import 'server-only';
import pool from "@/lib/db";
import { unstable_cache } from 'next/cache';

// ฟังก์ชัน Query รวมยอดผลกระทบจากอุทกภัยรายเดือนจากตาราง flood_data
async function fetchFloodData() {
  const sql = `
    SELECT 
      TRIM(province) AS province, 
      year, 
      month, 
      SUM(affected_people) AS total_affected,
      SUM(fatalities) AS total_fatalities,
      SUM(evacuees) AS total_evacuees,
      MAX(date) AS flood_date
    FROM flood_data
    GROUP BY TRIM(province), year, month
    ORDER BY year DESC, month ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

export const getFloodData = unstable_cache(
  async () => fetchFloodData(),
  ['flood-data-cache'],
  { revalidate: 3600 }
);