import 'server-only';
import pool from '@/lib/db';


export async function getFloodData() {
  const sql = `
    SELECT
      TRIM(province) AS province,
      year,
      month,
      SUM(affected_people) AS total_affected,
      SUM(fatalities) AS total_fatalities,
      SUM(evacuees) AS total_evacuees,
      MAX(date) AS flood_date
    FROM flood_event
    GROUP BY TRIM(province), year, month
    ORDER BY year DESC, month ASC
  `;

  const [rows] = await pool.query(sql);

  return rows;
}



export async function getFloodEventDetails() {
  const sql = `
    SELECT
      TRIM(province) AS province,
      year,
      month,
      date,
      NULLIF(TRIM(district), '') AS district,
      NULLIF(TRIM(subdistrict), '') AS subdistrict,
      NULLIF(TRIM(moo), '') AS moo,
      affected_people,
      fatalities,
      evacuees
    FROM flood_event
    ORDER BY year DESC, month ASC, date ASC
  `;

  const [rows] = await pool.query(sql);

  return rows;
}