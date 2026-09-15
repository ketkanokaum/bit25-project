import 'server-only';
import pool from "@/lib/db";

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
    FROM flood_event
    GROUP BY TRIM(province), year, month
    ORDER BY year DESC, month ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

export async function getFloodData() {
  return fetchFloodData();
}

// ข้อมูลดิบรายเหตุการณ์ (ไม่ group ด้วย SUM เหมือน fetchFloodData) เพื่อใช้แสดง
// พื้นที่ระดับอำเภอ/ตำบล/หมู่บ้านที่เคยมีรายงาน — fetchFloodData ข้างบน
// group ด้วย GROUP BY province,year,month จึงเหลือแค่ 1 แถวต่อเดือน ไม่พอ
// สำหรับไล่ดูว่าเดือนนั้นกระทบกี่ตำบล/หมู่บ้านบ้าง
async function fetchFloodEventDetails() {
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

export async function getFloodEventDetails() {
  return fetchFloodEventDetails();
}
