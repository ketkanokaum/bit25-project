// lib/data/rainfall.js
import 'server-only';
import pool from "@/lib/db";

const sqlQuery = `
  SELECT
    r.idrainfall_monthly,
    r.province,
    r.year,
    r.month,
    r.average_rain,
    c.baseline_mean,
    --  ข้อมูลผลกระทบจากน้ำท่วม (COALESCE เพื่อเปลี่ยน NULL เป็น 0)
    COALESCE(f.total_affected, 0) AS affected_people,
    COALESCE(f.total_fatalities, 0) AS fatalities,
    COALESCE(f.total_evacuees, 0) AS evacuees,
    -- วันที่เกิดเหตุล่าสุด
    f.flood_date AS date,
    --  Search Trends
    COALESCE(s.search_flood, 0) AS search_flood,
    COALESCE(s.search_rain, 0) AS search_rain,
    COALESCE(s.search_storm, 0) AS search_storm,
    COALESCE(s.search_water_level, 0) AS search_water_level,
    COALESCE(s.search_water_situation, 0) AS search_water_situation,
    COALESCE(s.search_evacuate, 0) AS search_evacuate
  FROM rainfall_monthly r
  --  ค่าฝนฐาน
  LEFT JOIN rainfall_climate_normals c 
    ON TRIM(r.province) = TRIM(c.province) 
    AND r.month = c.month
  --  สถิติน้ำท่วม (รวมยอดรายเดือน)
  LEFT JOIN (
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
  ) f
    ON TRIM(r.province) = f.province
    AND r.year = f.year
    AND r.month = f.month
  -- แนวโน้มการค้นหา
  LEFT JOIN search_trends s
    ON TRIM(r.province) = TRIM(s.province) 
    AND r.year = s.year
    AND r.month = s.month
  ORDER BY r.year DESC, r.month ASC
`;

// เก็บ cache ไว้ใน memory ของ server process
let cache = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 60 * 60 * 1000; // 1 ชั่วโมง (ms)

export async function getRainfallWithImpact() {
  const now = Date.now();

  // ถ้ามี cache และยังไม่หมดอายุ ใช้ของเดิมเลย ไม่ยิง DB ซ้ำ
  if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
    return cache.data;
  }

  try {
    const [rows] = await pool.query(sqlQuery);
    cache = { data: rows, timestamp: now };
    return rows;
  } catch (error) {
    console.error("Database Query Error:", error);
    // ถ้า query พังแต่ยังมี cache เก่าอยู่ ใช้ของเก่าไปก่อนดีกว่าคืน [] เปล่าๆ
    if (cache.data) return cache.data;
    return [];
  }
}