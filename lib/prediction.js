// ตรรกะการทำนายน้ำท่วม (k-NN ถ่วงน้ำหนัก) แยกออกมาจาก FloodSearchPatterns.js
// เพื่อไม่ให้ component ปนกันระหว่างการคำนวณกับ UI

// ปีที่มีสถิติน้ำท่วมยืนยันจริง (มาจากไฟล์ flood_data ที่ทำครั้งเดียวใน Colab)
// ไม่ได้เพิ่มเองอัตโนมัติเมื่อเวลาผ่านไป ต้องอัปเดตตรงนี้เองถ้ามีการนำเข้าข้อมูลปีใหม่เพิ่ม
export const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];
export const RULE_BASE_YEARS = REAL_DATA_YEARS;
export const LAST_REAL_YEAR = REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1];

export const METHOD_CONFIRMED = "confirmed";
export const METHOD_SEARCH_RAIN = "search_rain";
export const METHOD_RAIN_ONLY = "rain_only";
export const METHOD_HISTORY = "history";

export const METHOD_LABELS = {
  [METHOD_CONFIRMED]: "สถิติจริง",
  [METHOD_SEARCH_RAIN]: "เทียบรูปแบบการค้นหาและปริมาณฝน",
  [METHOD_RAIN_ONLY]: "เทียบปริมาณฝน (ไม่มีข้อมูลการค้นหาปีนี้)",
  [METHOD_HISTORY]: "ความถี่ในอดีต (ไม่มีข้อมูลปีนี้)",
};

export const SEARCH_FIELDS = [
  "search_flood",
  "search_rain",
  "search_storm",
  "search_water_level",
  "search_water_situation",
  "search_evacuate",
];

// หาว่าข้อมูลจริงที่โหลดมามีถึงเดือน/ปีไหน แทนการเขียนตัวเลขปี/เดือนตายตัวในโค้ด
// เดือนไหนมีค่า search_flood ไม่เป็น null = มีข้อมูล Google Trends ถึงเดือนนั้น
// เดือนไหนมีค่า average_rain ไม่เป็น null = มีข้อมูลฝนถึงเดือนนั้น
export function getDataBoundaries(data) {
  let searchEndKey = 0;
  let rainEndKey = 0;

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const key = parseInt(r.year) * 12 + parseInt(r.month);

    if (r.search_flood != null && key > searchEndKey) {
      searchEndKey = key;
    }
    if (r.average_rain != null && key > rainEndKey) {
      rainEndKey = key;
    }
  }

  const searchEndYear = Math.floor(searchEndKey / 12);
  const searchEndMonth = searchEndKey - searchEndYear * 12;
  const rainEndYear = Math.floor(rainEndKey / 12);
  const rainEndMonth = rainEndKey - rainEndYear * 12;

  let lastSelectableYear = LAST_REAL_YEAR;
  if (rainEndYear > lastSelectableYear) lastSelectableYear = rainEndYear;
  if (searchEndYear > lastSelectableYear) lastSelectableYear = searchEndYear;

  return { searchEndYear, searchEndMonth, rainEndYear, rainEndMonth, lastSelectableYear };
}

// รายการปีทั้งหมดที่เลือกได้ในหน้าเว็บ ตั้งแต่ปีแรกที่มีข้อมูลจริง ถึงปีล่าสุดที่มีข้อมูล (จาก getDataBoundaries)
export function getAllYears(lastSelectableYear) {
  const years = [];
  for (let y = REAL_DATA_YEARS[0]; y <= lastSelectableYear; y++) {
    years.push(y);
  }
  return years;
}

export function getFloodEvents(data, province, year, month) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (
      r.province === province &&
      parseInt(r.year) === parseInt(year) &&
      parseInt(r.month) === parseInt(month) &&
      r.date
    ) {
      result.push(r);
    }
  }
  return result;
}

export function didFloodHappen(data, province, year, month) {
  return getFloodEvents(data, province, year, month).length > 0;
}

export function countFloodYears(data, province, month) {
  const years = [];
  for (let i = 0; i < REAL_DATA_YEARS.length; i++) {
    const y = REAL_DATA_YEARS[i];
    if (didFloodHappen(data, province, y, month)) years.push(y);
  }
  return {
    years: years,
    count: years.length,
    total: REAL_DATA_YEARS.length,
    rate: years.length / REAL_DATA_YEARS.length,
  };
}

export function getMonthRow(data, province, year, month) {
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (
      r.province === province &&
      parseInt(r.year) === parseInt(year) &&
      parseInt(r.month) === parseInt(month)
    ) {
      return r;
    }
  }
  return null;
}

export function getBaseline(data, province, month) {
  const rows = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (r.province === province && parseInt(r.month) === parseInt(month)) {
      rows.push(r);
    }
  }
  if (rows.length === 0) return { value: null, fromTable: false };

  let withBaseline = null;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].baseline_mean != null) {
      withBaseline = rows[i];
      break;
    }
  }
  if (withBaseline) {
    return { value: Math.round(parseFloat(withBaseline.baseline_mean)), fromTable: true };
  }

  const past = [];
  for (let i = 0; i < rows.length; i++) {
    if (RULE_BASE_YEARS.includes(parseInt(rows[i].year))) past.push(rows[i]);
  }
  if (past.length === 0) return { value: null, fromTable: false };
  let sum = 0;
  for (let i = 0; i < past.length; i++) {
    sum += parseFloat(past[i].average_rain) || 0;
  }
  return { value: Math.round(sum / past.length), fromTable: false };
}

function pickMethod(year, month, boundaries) {
  const y = parseInt(year);
  const m = parseInt(month);
  if (REAL_DATA_YEARS.includes(y)) return METHOD_CONFIRMED;
  if (y * 12 + m <= boundaries.searchEndYear * 12 + boundaries.searchEndMonth) return METHOD_SEARCH_RAIN;
  if (y * 12 + m <= boundaries.rainEndYear * 12 + boundaries.rainEndMonth) return METHOD_RAIN_ONLY;
  return METHOD_HISTORY;
}

function makeFeatures(row, useSearch) {
  if (!row) return null;
  const list = [];
  if (useSearch) {
    for (let i = 0; i < SEARCH_FIELDS.length; i++) {
      list.push(Number(row[SEARCH_FIELDS[i]]) || 0);
    }
  }
  list.push(Number(row.average_rain) || 0);
  return list;
}

function scaleAll(lists) {
  const size = lists[0].length;
  const mins = [];
  const maxs = [];
  for (let i = 0; i < size; i++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j < lists.length; j++) {
      if (lists[j][i] < lo) lo = lists[j][i];
      if (lists[j][i] > hi) hi = lists[j][i];
    }
    mins.push(lo);
    maxs.push(hi);
  }
  const scaled = [];
  for (let j = 0; j < lists.length; j++) {
    const row = [];
    for (let i = 0; i < lists[j].length; i++) {
      if (maxs[i] === mins[i]) {
        row.push(0);
      } else {
        row.push((lists[j][i] - mins[i]) / (maxs[i] - mins[i]));
      }
    }
    scaled.push(row);
  }
  return scaled;
}

function similarity(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) * (a[i] - b[i]);
  }
  return 1 / (1 + Math.sqrt(sum));
}

export function predictFlood(data, province, year, month, boundaries) {
  const method = pickMethod(year, month, boundaries);
  const history = countFloodYears(data, province, month);

  if (method === METHOD_CONFIRMED) {
    const events = getFloodEvents(data, province, year, month);
    return {
      method: method,
      label: METHOD_LABELS[method],
      willFlood: events.length > 0,
      chance: events.length > 0 ? 1 : 0,
      neighbors: [],
      history: history,
      note: "",
    };
  }

  if (method === METHOD_HISTORY) {
    return {
      method: method,
      label: METHOD_LABELS[method],
      willFlood: history.rate >= 0.5,
      chance: history.rate,
      neighbors: [],
      history: history,
      note: "ไม่มีข้อมูลฝนและการค้นหาของปีนี้ ผลจึงเท่ากันทุกปีสำหรับเดือนนี้",
    };
  }

  const useSearch = method === METHOD_SEARCH_RAIN;
  const targetRow = getMonthRow(data, province, year, month);
  const targetFeatures = makeFeatures(targetRow, useSearch);

  const candidates = [];
  for (let i = 0; i < REAL_DATA_YEARS.length; i++) {
    const y = REAL_DATA_YEARS[i];
    const row = getMonthRow(data, province, y, month);
    const features = makeFeatures(row, useSearch);
    if (!features) continue;
    candidates.push({
      year: y,
      features: features,
      flooded: didFloodHappen(data, province, y, month),
      rain: Math.round(Number(row.average_rain) || 0),
    });
  }

  if (!targetFeatures || candidates.length < 2) {
    return {
      method: METHOD_HISTORY,
      label: METHOD_LABELS[METHOD_HISTORY],
      willFlood: history.rate >= 0.5,
      chance: history.rate,
      neighbors: [],
      history: history,
      note: "ข้อมูลไม่พอสำหรับเทียบรูปแบบ ใช้ความถี่ในอดีตแทน",
    };
  }

  const listsToScale = [targetFeatures];
  for (let i = 0; i < candidates.length; i++) {
    listsToScale.push(candidates[i].features);
  }
  const scaled = scaleAll(listsToScale);

  const scoredCandidates = [];
  for (let i = 0; i < candidates.length; i++) {
    scoredCandidates.push({
      year: candidates[i].year,
      flooded: candidates[i].flooded,
      rain: candidates[i].rain,
      score: similarity(scaled[0], scaled[i + 1]),
    });
  }
  scoredCandidates.sort((a, b) => b.score - a.score);
  const neighbors = scoredCandidates.slice(0, 3);

  let floodWeight = 0;
  let totalWeight = 0;
  for (let i = 0; i < neighbors.length; i++) {
    totalWeight += neighbors[i].score;
    if (neighbors[i].flooded) floodWeight += neighbors[i].score;
  }
  let chance = 0;
  if (totalWeight > 0) chance = floodWeight / totalWeight;

  let note = "";
  if (!useSearch) note = "ไม่มีข้อมูลการค้นหาของปีนี้ เทียบจากปริมาณฝนอย่างเดียว";

  return {
    method: method,
    label: METHOD_LABELS[method],
    willFlood: chance >= 0.5,
    chance: chance,
    neighbors: neighbors,
    history: history,
    note: note,
  };
}
