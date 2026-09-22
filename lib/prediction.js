export const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];
export const LAST_REAL_YEAR = REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1];

export const METHOD_CONFIRMED = "confirmed";
export const METHOD_MODEL = "model";
export const METHOD_CLIMATOLOGY = "climatology";

export const METHOD_LABELS = {
  [METHOD_CONFIRMED]: "สถิติที่เกิดขึ้นจริง",
  [METHOD_MODEL]: "ระดับการเฝ้าระวังสำหรับเดือน",
  [METHOD_CLIMATOLOGY]: "ระดับจากประวัติย้อนหลัง",
};

export const ASSESSMENT_HISTORICAL_PLUS_SEARCH = "historical_plus_search";
export const ASSESSMENT_HISTORICAL_ONLY = "historical_only";

export const SEARCH_FIELDS = [
  "search_flood", "search_rain", "search_storm",
  "search_water_level", "search_water_situation", "search_evacuate",
];

export const SEARCH_LABELS = {
  search_flood: "น้ำท่วม", search_rain: "ฝนตก", search_storm: "พายุ",
  search_water_level: "ระดับน้ำ", search_water_situation: "สถานการณ์น้ำ",
  search_evacuate: "อพยพ",
};

const SEARCH_HIGH_QUANTILE = 2 / 3;
const MIN_PAST_MONTHS = 12;

function yearMonthKey(year, month) {
  return parseInt(year) * 12 + (parseInt(month) - 1);
}
function decodeYearMonthKey(key) {
  return { year: Math.floor(key / 12), month: (key % 12) + 1 };
}
function hasAllSearchData(row) {
  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    if (row[SEARCH_FIELDS[i]] == null) return false;
  }
  return true;
}
function getFieldValues(rows, field) {
  const values = [];
  for (let i = 0; i < rows.length; i++) values.push(Number(rows[i][field]));
  return values;
}
function quantile(sortedValues, q) {
  const n = sortedValues.length;
  if (n === 0) return null;
  if (n === 1) return sortedValues[0];
  const position = (n - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  if (low === high) return sortedValues[low];
  const lowValue = sortedValues[low];
  const highValue = sortedValues[high];
  return lowValue + (highValue - lowValue) * (position - low);
}

export function getDataBoundaries(data) {
  let searchEndKey = -1;
  let rainEndKey = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const key = yearMonthKey(row.year, row.month);
    if (hasAllSearchData(row) && key > searchEndKey) searchEndKey = key;
    if (row.average_rain != null && key > rainEndKey) rainEndKey = key;
  }
  let searchEnd = { year: 0, month: 0 };
  let rainEnd = { year: 0, month: 0 };
  if (searchEndKey >= 0) searchEnd = decodeYearMonthKey(searchEndKey);
  if (rainEndKey >= 0) rainEnd = decodeYearMonthKey(rainEndKey);
  let lastSelectableYear = LAST_REAL_YEAR;
  if (searchEnd.year > lastSelectableYear) lastSelectableYear = searchEnd.year;
  if (rainEnd.year > lastSelectableYear) lastSelectableYear = rainEnd.year;
  return {
    searchEndYear: searchEnd.year, searchEndMonth: searchEnd.month,
    rainEndYear: rainEnd.year, rainEndMonth: rainEnd.month,
    lastSelectableYear: lastSelectableYear,
  };
}

export function getAllYears(lastSelectableYear) {
  const years = [];
  for (let year = REAL_DATA_YEARS[0]; year <= lastSelectableYear; year++) years.push(year);
  return years;
}

export function getFloodEvents(data, province, year, month) {
  const events = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province === province && parseInt(row.year) === parseInt(year) &&
        parseInt(row.month) === parseInt(month) && row.date) events.push(row);
  }
  return events;
}

export function didFloodHappen(data, province, year, month) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province === province && parseInt(row.year) === parseInt(year) &&
        parseInt(row.month) === parseInt(month) && row.date) return true;
  }
  return false;
}

export function countFloodYears(data, province, month) {
  const years = [];
  for (let i = 0; i < REAL_DATA_YEARS.length; i++) {
    const year = REAL_DATA_YEARS[i];
    if (didFloodHappen(data, province, year, month)) years.push(year);
  }
  return {
    years: years, count: years.length,
    total: REAL_DATA_YEARS.length,
    rate: years.length / REAL_DATA_YEARS.length,
  };
}

export function getMonthRow(data, province, year, month) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province === province && parseInt(row.year) === parseInt(year) &&
        parseInt(row.month) === parseInt(month)) return row;
  }
  return null;
}

export function getBaseline(data, province, month) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province === province && parseInt(row.month) === parseInt(month) &&
        row.baseline_mean != null && row.baseline_mean !== "") {
      return { value: Math.round(parseFloat(row.baseline_mean)), fromTable: true };
    }
  }
  return { value: null, fromTable: false };
}

function collectPastSearchMonths(data, province, targetYear) {
  const months = new Map();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province !== province) continue;
    if (parseInt(row.year) >= parseInt(targetYear)) continue;
    if (!hasAllSearchData(row)) continue;
    const key = yearMonthKey(row.year, row.month);
    if (!months.has(key)) months.set(key, row);
  }
  return Array.from(months.values());
}

export function getSearchDetail(data, province, year, month) {
  const currentRow = getMonthRow(data, province, year, month);
  if (!currentRow) return null;
  if (!hasAllSearchData(currentRow)) return null;
  const pastMonths = collectPastSearchMonths(data, province, year);
  if (pastMonths.length < MIN_PAST_MONTHS) return null;
  const terms = [];
  let count = 0;
  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    const field = SEARCH_FIELDS[i];
    const values = getFieldValues(pastMonths, field);
    values.sort(function (a, b) { return a - b; });
    const normal = quantile(values, SEARCH_HIGH_QUANTILE);
    const value = Number(currentRow[field]);
    const isHigh = value > normal;
    if (isHigh) count++;
    terms.push({ field: field, label: SEARCH_LABELS[field], value: value, normal: normal, isHigh: isHigh });
  }
  return { count: count, terms: terms };
}

export const KEYWORD_NO_SEARCH = "NoSearch";
export const KEYWORD_WITHIN_THRESHOLD = "WithinThreshold";
export const KEYWORD_ABOVE_THRESHOLD = "AboveThreshold";
export const KEYWORD_NO_THRESHOLD = "NoThreshold";

function collectReferenceSearchMonths(data, province) {
  const months = new Map();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province !== province) continue;
    if (!REAL_DATA_YEARS.includes(parseInt(row.year))) continue;
    if (!hasAllSearchData(row)) continue;
    const key = yearMonthKey(row.year, row.month);
    if (!months.has(key)) months.set(key, row);
  }
  return Array.from(months.values());
}

function getPositiveP67(values) {
  const positiveValues = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0) positiveValues.push(values[i]);
  }
  if (positiveValues.length === 0) return null;
  positiveValues.sort(function (a, b) { return a - b; });
  return quantile(positiveValues, SEARCH_HIGH_QUANTILE);
}

export function getSearchActivityDetail(data, province, year, month) {
  const currentRow = getMonthRow(data, province, year, month);
  if (!currentRow) 
    return null;

  if (!hasAllSearchData(currentRow)) 
    return null;
  
  const referenceMonths = collectReferenceSearchMonths(data, province);
  if (referenceMonths.length === 0) 
    return null;

  const terms = [];
  let elevatedCount = 0;
  let noRefCount = 0;

  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    const field = SEARCH_FIELDS[i];
    const values = getFieldValues(referenceMonths, field);
    const threshold = getPositiveP67(values);
    const value = Number(currentRow[field]);
    
    let status = KEYWORD_WITHIN_THRESHOLD;
    if (value === 0) { status = KEYWORD_NO_SEARCH; }
    else if (threshold === null) { status = KEYWORD_NO_THRESHOLD; noRefCount++; }
    else if (value > threshold) { status = KEYWORD_ABOVE_THRESHOLD; elevatedCount++; }
    terms.push({ field: field, label: SEARCH_LABELS[field], value: value, threshold: threshold, status: status });
  }
  return { terms: terms, elevatedCount: elevatedCount, noRefCount: noRefCount, hasElevatedSignal: elevatedCount > 0 };
}

export function getHistoricalLevel(floodCount) {
  if (floodCount == null) return null;
  if (floodCount <= 1) return "low";
  if (floodCount <= 3) return "medium";
  return "high";
}

export function getMonitoringLevel(floodCount, hasElevatedSignal) {
  if (floodCount == null) return null;
  if (floodCount === 0) return "low";
  if (floodCount === 1) { if (hasElevatedSignal) return "medium"; return "low"; }
  if (floodCount === 2 || floodCount === 3) { if (hasElevatedSignal) return "high"; return "medium"; }
  return "high";
}

function isMonitoringRequired(level) {
  return level === "medium" || level === "high";
}

export function getMonitoringLevelInfo(key) {
  if (key == null) return null;
  for (let i = 0; i < RISK_LEVELS.length; i++) {
    if (RISK_LEVELS[i].key === key) return RISK_LEVELS[i];
  }
  return null;
}

export const OFFICIAL_SOURCES = [
  { name: "กรมป้องกันและบรรเทาสาธารณภัย", url: "https://www.disaster.go.th" },
  { name: "คลังข้อมูลน้ำแห่งชาติ", url: "https://www.thaiwater.net" },
  { name: "กรมอุตุนิยมวิทยา", url: "https://www.tmd.go.th" },
];

export const DISCLAIMER = "ข้อมูลนี้ใช้ประกอบการเฝ้าระวัง ไม่ทดแทนประกาศจากหน่วยงานทางการ";

export const RISK_LEVELS = [
  { tier: 1, key: "low", label: "สถานการณ์ปกติ", chanceLabel: "น้อย", range: "< 33.33%", observedRate: 7.4,
    advice: { title: "ติดตามสถานการณ์ตามปกติ", bullets: ["ตรวจสอบพยากรณ์อากาศเป็นระยะ","ติดตามข่าวสารจากหน่วยงานในพื้นที่","ยังไม่จำเป็นต้องเตรียมการเป็นพิเศษ"] },
    hex: { color: "#15803d", bg: "#f0fdf4", border: "#86efac", dot: "#22c55e" },
    tw: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700" } },
  { tier: 2, key: "medium", label: "เฝ้าระวังปานกลาง", chanceLabel: "ปานกลาง", range: "33.33% – < 66.67%", observedRate: 26.2,
    advice: { title: "เริ่มเตรียมความพร้อม", bullets: ["ติดตามสภาพอากาศและระดับน้ำอย่างสม่ำเสมอ","เตรียมยา เอกสารสำคัญ และของจำเป็น","ตรวจสอบทางระบายน้ำรอบบ้าน","วางแผนเคลื่อนย้ายทรัพย์สินหากระดับน้ำเพิ่มขึ้น"] },
    hex: { color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
    tw: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" } },
  { tier: 3, key: "high", label: "เฝ้าระวังสูง", chanceLabel: "มาก", range: "≥ 66.67%", observedRate: 67.5,
    advice: { title: "เตรียมพร้อมรับสถานการณ์", bullets: ["ติดตามประกาศเตือนภัยอย่างใกล้ชิด","เตรียมกระเป๋าฉุกเฉินและยาประจำตัว","ย้ายสิ่งของสำคัญขึ้นที่สูง","ตรวจสอบเส้นทางและจุดอพยพ","ปฏิบัติตามประกาศของหน่วยงานในพื้นที่ทันที"] },
    hex: { color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
    tw: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" } },
];

export function predictFlood(data, province, year, month) {
  const selectedYear = parseInt(year);
  const selectedMonth = parseInt(month);
  const history = countFloodYears(data, province, selectedMonth);

  if (REAL_DATA_YEARS.includes(selectedYear)) {
    const events = getFloodEvents(data, province, selectedYear, selectedMonth);
    const occurred = events.length > 0;
    return {
      method: METHOD_CONFIRMED, label: METHOD_LABELS[METHOD_CONFIRMED],
      score: occurred ? 1 : 0, occurred: occurred,
      requiresMonitoring: occurred, history: history, note: "",
    };
  }

  const activity = getSearchActivityDetail(data, province, selectedYear, selectedMonth);

  if (activity === null) {
    const historicalLevel = getHistoricalLevel(history.count);
    return {
      method: METHOD_CLIMATOLOGY, label: METHOD_LABELS[METHOD_CLIMATOLOGY],
      assessmentType: ASSESSMENT_HISTORICAL_ONLY,
      historicalLevel: historicalLevel, monitoringLevel: null,
      score: null, occurred: null,
      requiresMonitoring: isMonitoringRequired(historicalLevel),
      history: history, searchDataAvailable: false, searchTerms: null,
      elevatedCount: null, noRefCount: null, hasElevatedSignal: null,
      searchHighTotal: SEARCH_FIELDS.length,
    };
  }

  const monitoringLevel = getMonitoringLevel(history.count, activity.hasElevatedSignal);
  return {
    method: METHOD_MODEL, label: METHOD_LABELS[METHOD_MODEL],
    assessmentType: ASSESSMENT_HISTORICAL_PLUS_SEARCH,
    historicalLevel: null, monitoringLevel: monitoringLevel,
    score: null, occurred: null,
    requiresMonitoring: isMonitoringRequired(monitoringLevel),
    history: history, searchDataAvailable: true,
    searchTerms: activity.terms, elevatedCount: activity.elevatedCount,
    noRefCount: activity.noRefCount, hasElevatedSignal: activity.hasElevatedSignal,
    searchHighTotal: SEARCH_FIELDS.length, note: "",
  };
}
