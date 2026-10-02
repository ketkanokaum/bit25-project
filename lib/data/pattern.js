import 'server-only';
import pool from '@/lib/db';
import { getCached, TEN_MINUTES } from '@/lib/cache';

async function fetchCombinedPatternData() {

    const sql = `
        WITH flood_summary AS (
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
        )
        SELECT
        TRIM(r.province) AS province,
        r.year,
        r.month,
        r.average_rain,
        c.baseline_mean,
        
        -- ข้อมูลอุทกภัย (ถ้าไม่มีจะเป็น NULL อัตโนมัติ)
        f.total_affected AS affected_people,
        f.total_fatalities AS fatalities,
        f.total_evacuees AS evacuees,
        f.flood_date AS date,
        
        -- Google Trends
        t.search_flood,
        t.search_rain,
        t.search_storm,
        t.search_water_level,
        t.search_water_situation,
        t.search_evacuate
        FROM rainfall_monthly r
        LEFT JOIN rainfall_climate_normals c
        ON TRIM(r.province) = TRIM(c.province) AND r.month = c.month
        LEFT JOIN flood_summary f
        ON TRIM(r.province) = f.province AND r.year = f.year AND r.month = f.month
        LEFT JOIN search_trends t
        ON TRIM(r.province) = TRIM(t.province) AND r.year = t.year AND r.month = t.month
        ORDER BY r.year DESC, r.month ASC;
    `;

    const [rows] = await pool.query(sql);
    return rows;
    }

    export async function getCombinedPatternData() {
    // ยังคง Cache ผลลัพธ์ไว้ 10 นาทีเหมือนเดิม
    return getCached('combined-pattern-data', TEN_MINUTES, fetchCombinedPatternData);
    }