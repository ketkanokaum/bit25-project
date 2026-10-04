import 'server-only';
import pool from '@/lib/db';
import { getCached, TEN_MINUTES } from '@/lib/cache';

const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];
const LAST_REAL_YEAR = REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1];

function decodeYearMonthKey(key) {
  return { year: Math.floor(key / 12), month: (key % 12) + 1 };
}

async function loadPatternBoundaries() {
  const [[searchRow]] = await pool.query(`
    SELECT MAX(year * 12 + (month - 1)) AS search_end_key
    FROM search_trends
    WHERE search_flood IS NOT NULL
      AND search_rain IS NOT NULL
      AND search_storm IS NOT NULL
      AND search_water_level IS NOT NULL
      AND search_water_situation IS NOT NULL
      AND search_evacuate IS NOT NULL
  `);

  const [[rainRow]] = await pool.query(`
    SELECT MAX(year * 12 + (month - 1)) AS rain_end_key
    FROM rainfall_monthly
    WHERE average_rain IS NOT NULL
  `);

  let searchEnd = { year: 0, month: 0 };
  let rainEnd = { year: 0, month: 0 };
  if (searchRow.search_end_key != null) searchEnd = decodeYearMonthKey(searchRow.search_end_key);
  if (rainRow.rain_end_key != null) rainEnd = decodeYearMonthKey(rainRow.rain_end_key);

  let lastSelectableYear = LAST_REAL_YEAR;
  if (searchEnd.year > lastSelectableYear) lastSelectableYear = searchEnd.year;
  if (rainEnd.year > lastSelectableYear) lastSelectableYear = rainEnd.year;

  return {
    searchEndYear: searchEnd.year,
    searchEndMonth: searchEnd.month,
    rainEndYear: rainEnd.year,
    rainEndMonth: rainEnd.month,
    lastSelectableYear: lastSelectableYear,
  };
}

export async function getPatternBoundaries() {
  return getCached('pattern-boundaries', TEN_MINUTES, loadPatternBoundaries);
}

function makeYearMonthKey(item) {
  return `${item.year}_${item.month}`;
}

function createLookup(list) {
  const lookup = {};
  for (let i = 0; i < list.length; i++) {
    lookup[makeYearMonthKey(list[i])] = list[i];
  }
  return lookup;
}

function splitItems(text) {
  const result = [];
  if (!text) return result;
  const parts = text.split(',');
  for (let i = 0; i < parts.length; i++) {
    const trimmed = parts[i].trim();
    if (trimmed !== '') result.push(trimmed);
  }
  return result;
}

// ดึงข้อมูลสำหรับหน้าเฝ้าระวังอุทกภัยเฉพาะจังหวัดที่เลือก แทนการดึงทุกจังหวัดมารวมกันทีเดียว
// (รวม rainfall + flood summary + Google Trends ต่อ จังหวัด+ปี+เดือน, กฎ Association Rules, และรายละเอียดเหตุการณ์น้ำท่วม)
async function loadProvincePatternData(province) {
  const [rainfallRows] = await pool.query(
    `SELECT TRIM(province) AS province, year, month, average_rain
     FROM rainfall_monthly
     WHERE TRIM(province) = ?
     ORDER BY year DESC, month ASC`,
    [province]
  );

  const [floodSummaryRows] = await pool.query(
    `SELECT TRIM(province) AS province, year, month,
       SUM(affected_people) AS total_affected,
       SUM(fatalities) AS total_fatalities,
       SUM(evacuees) AS total_evacuees,
       MAX(date) AS flood_date
     FROM flood_event
     WHERE TRIM(province) = ?
     GROUP BY TRIM(province), year, month
     ORDER BY year DESC, month ASC`,
    [province]
  );

  const [trendRows] = await pool.query(
    `SELECT TRIM(province) AS province, year, month,
       search_flood, search_rain, search_storm,
       search_water_level, search_water_situation, search_evacuate
     FROM search_trends
     WHERE TRIM(province) = ?
     ORDER BY year DESC, month ASC`,
    [province]
  );

  const [floodEventRows] = await pool.query(
    `SELECT TRIM(province) AS province, year, month, date,
       NULLIF(TRIM(district), '') AS district,
       NULLIF(TRIM(subdistrict), '') AS subdistrict,
       NULLIF(TRIM(moo), '') AS moo,
       affected_people, fatalities, evacuees
     FROM flood_event
     WHERE TRIM(province) = ?
     ORDER BY year DESC, month ASC, date ASC`,
    [province]
  );

  const [ruleRows] = await pool.query(
    `SELECT idassociation_rules, year, month, province, consequents, antecedents, support, confidence, lift
     FROM association_rules
     WHERE province = ?`,
    [province]
  );

  const floodByKey = createLookup(floodSummaryRows);
  const trendByKey = createLookup(trendRows);

  const combinedData = [];
  for (let i = 0; i < rainfallRows.length; i++) {
    const rain = rainfallRows[i];
    const key = makeYearMonthKey(rain);
    const flood = floodByKey[key] || {};
    const trend = trendByKey[key] || {};

    combinedData.push({
      ...rain,
      affected_people: flood.total_affected ?? null,
      fatalities: flood.total_fatalities ?? null,
      evacuees: flood.total_evacuees ?? null,
      date: flood.flood_date ?? null,
      search_flood: trend.search_flood ?? null,
      search_rain: trend.search_rain ?? null,
      search_storm: trend.search_storm ?? null,
      search_water_level: trend.search_water_level ?? null,
      search_water_situation: trend.search_water_situation ?? null,
      search_evacuate: trend.search_evacuate ?? null,
    });
  }

  const rules = [];
  for (let i = 0; i < ruleRows.length; i++) {
    const row = ruleRows[i];
    rules.push({
      id: row.idassociation_rules,
      year: parseInt(row.year),
      month: parseInt(row.month),
      province: row.province,
      antecedents: splitItems(row.antecedents),
      consequents: splitItems(row.consequents),
      support: parseFloat(row.support) || 0,
      confidence: parseFloat(row.confidence) || 0,
      lift: parseFloat(row.lift) || 0,
    });
  }

  return {
    data: combinedData,
    rules: rules,
    floodEvents: floodEventRows,
  };
}

export async function getProvincePatternData(province) {
  return getCached(`pattern-province-${province}`, TEN_MINUTES, () => loadProvincePatternData(province));
}
