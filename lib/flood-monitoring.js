import { isHighFloodRisk } from '@/lib/rainlevel';

export const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];

export const LAST_REAL_YEAR = REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1];

export const METHOD_MODEL = "model";

export const ASSESSMENT_HISTORICAL_ONLY = "historical_only";

export const SEARCH_INDEX_MIN = 1;

export const SEARCH_FIELDS = ["search_flood", "search_rain", "search_storm", "search_water_level", "search_water_situation", "search_evacuate"];

export const SEARCH_LABELS = {
  search_flood: "น้ำท่วม", search_rain: "ฝนตกหนัก", search_storm: "พายุเข้าไทย",
  search_water_level: "ระดับน้ำ", search_water_situation: "สถานการณ์น้ำ", search_evacuate: "อพยพ",
};

export const thaiMonthNames = { 1: "มกราคม", 2: "กุมภาพันธ์", 3: "มีนาคม", 4: "เมษายน", 5: "พฤษภาคม", 6: "มิถุนายน", 7: "กรกฎาคม", 8: "สิงหาคม", 9: "กันยายน", 10: "ตุลาคม", 11: "พฤศจิกายน", 12: "ธันวาคม" };

export const RISK_LEVELS = [
  {
    key: "low", label: "สถานการณ์ปกติ",
    advice: {
      title: "ติดตามสถานการณ์ตามปกติ",
      bullets: ["ตรวจสอบพยากรณ์อากาศเป็นระยะ", "ติดตามข่าวสารจากหน่วยงานในพื้นที่", "ยังไม่จำเป็นต้องเตรียมการเป็นพิเศษ"],
    },
    tw: { text: "text-green-700" },
  },
  {
    key: "medium", label: "เฝ้าระวังปานกลาง",
    advice: {
      title: "รับมืออุทกภัย",
      bullets: ["ติดตามพยากรณ์อากาศและประกาศเตือนภัย พร้อมปฏิบัติตามอย่างเคร่งครัด", "จัดเตรียมสิ่งของเครื่องใช้ที่จำเป็นไว้ใช้เมื่อเกิดภัย (ถุงยังชีพ)", "จัดสภาพแวดล้อมให้ปลอดภัยจากน้ำท่วม", "หมั่นสังเกตสัญญาณความผิดปกติทางธรรมชาติ"],
    },
    tw: { text: "text-amber-700" },
  },
  {
    key: "high", label: "เฝ้าระวังสูง",
    advice: {
      title: "ปฏิบัติตนปลอดภัย",
      bullets: ["ติดตามพยากรณ์อากาศและประกาศเตือนภัย พร้อมปฏิบัติตามอย่างเคร่งครัด", "ขนย้ายสิ่งของเครื่องใช้ขึ้นที่สูง", "ตัดกระแสไฟฟ้าและงดใช้เครื่องใช้ไฟฟ้าเมื่อน้ำท่วมบ้าน", "ระมัดระวังภัยในช่วงน้ำท่วม อาทิ จมน้ำ สัตว์มีพิษ ไฟฟ้าดูด", "หากสถานการณ์รุนแรง ให้อพยพไปตามเส้นทางที่ปลอดภัย"],
    },
    tw: { text: "text-red-700" },
  },
];

export const NODE_COLORS = { cause: "#F59E0B", effect: "#0EA5E9" };

export function hasAllSearchData(row) {
  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    if (row[SEARCH_FIELDS[i]] == null) return false;
  }
  return true;
}

export function getAllYears(lastSelectableYear) {
  const years = [];
  for (let year = REAL_DATA_YEARS[0]; year <= lastSelectableYear; year++) {
    years.push(year);
  }
  return years;
}

export function matchesProvincePeriod(row, province, year, month) {
  return row.province === province &&
    parseInt(row.year) === parseInt(year) &&
    parseInt(row.month) === parseInt(month);
}

export function getFloodEvents(data, province, year, month) {
  const events = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (matchesProvincePeriod(row, province, year, month) && row.date) {
      events.push(row);
    }
  }
  return events;
}

export function didFloodHappen(data, province, year, month) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (matchesProvincePeriod(row, province, year, month) && row.date) {
      return true;
    }
  }
  return false;
}

export function countFloodYears(data, province, month) {
  const years = [];
  for (let i = 0; i < REAL_DATA_YEARS.length; i++) {
    const year = REAL_DATA_YEARS[i];
    if (didFloodHappen(data, province, year, month)) {
      years.push(year);
    }
  }

  return { count: years.length, total: REAL_DATA_YEARS.length };
}

export function getMonthRow(data, province, year, month) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (matchesProvincePeriod(row, province, year, month)) return row;
  }
  return null;
}

export function getSearchActivityDetail(data, province, year, month) {
  const currentRow = getMonthRow(data, province, year, month);
  if (!currentRow || !hasAllSearchData(currentRow)) return null;

  const foundFields = [];
  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    const field = SEARCH_FIELDS[i];
    if (Number(currentRow[field]) >= SEARCH_INDEX_MIN) {
      foundFields.push(field);
    }
  }

  return { foundFields: foundFields, hasSearchActivity: foundFields.length > 0 };
}

export function getHistoricalLevel(floodCount) {
  if (floodCount == null) return null;
  if (floodCount <= 1) return "low";
  if (floodCount <= 3) return "medium";
  return "high";
}

export function getMonitoringLevel(floodCount, hasSearchActivity) {
  if (floodCount == null) return null;
  if (floodCount === 0) return "low";

  if (floodCount === 1) {
    if (hasSearchActivity) return "medium";
    return "low";
  }

  if (floodCount === 2 || floodCount === 3) {
    if (hasSearchActivity) return "high";
    return "medium";
  }

  return "high";
}

export function isMonitoringRequired(level) {
  return level === "medium" || level === "high";
}

export function getMonitoringLevelInfo(key) {
  if (key == null) return null;
  for (let i = 0; i < RISK_LEVELS.length; i++) {
    if (RISK_LEVELS[i].key === key) return RISK_LEVELS[i];
  }
  return null;
}

export function predictFlood(data, province, year, month) {
  const selectedYear = parseInt(year);
  const selectedMonth = parseInt(month);
  const history = countFloodYears(data, province, selectedMonth);

  if (REAL_DATA_YEARS.includes(selectedYear)) {
    const occurred = getFloodEvents(data, province, selectedYear, selectedMonth).length > 0;

    return {
      method: "confirmed", label: "สถิติที่เกิดขึ้นจริง",
      requiresMonitoring: occurred, history: history,
    };
  }

  const activity = getSearchActivityDetail(data, province, selectedYear, selectedMonth);

  if (activity === null) {
    const historicalLevel = getHistoricalLevel(history.count);
    return {
      method: "climatology", label: "ระดับจากประวัติย้อนหลัง",
      assessmentType: ASSESSMENT_HISTORICAL_ONLY,
      historicalLevel: historicalLevel, monitoringLevel: null,
      requiresMonitoring: isMonitoringRequired(historicalLevel), history: history,
    };
  }

  const monitoringLevel = getMonitoringLevel(history.count, activity.hasSearchActivity);

  return {
    method: METHOD_MODEL, label: "ระดับการเฝ้าระวังสำหรับเดือน",
    assessmentType: "historical_plus_search",
    historicalLevel: null, monitoringLevel: monitoringLevel,
    requiresMonitoring: isMonitoringRequired(monitoringLevel), history: history,
  };
}

export function formatThaiDate(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear() + 543;
  return `${day} ${thaiMonthNames[month]} ${year}`;
}

export function formatCountOrDash(n) {
  if (n > 0) return n.toLocaleString();
  return "-";
}

export function translateWord(word) {
  const dict = {
    rain_level_High: "ปริมาณน้ำฝนสูง (≥ 200 มม.)",
    search_rain: "ค้นหา 'ฝนตกหนัก'", search_flood: "ค้นหา 'น้ำท่วม'",
    search_storm: "ค้นหา 'พายุเข้าไทย'", search_evacuate: "ค้นหา 'อพยพ'",
    search_water_level: "ค้นหา 'ระดับน้ำ'", search_water_situation: "ค้นหา 'สถานการณ์น้ำ'",
  };

  const translated = dict[word];
  if (translated) return translated;
  return word;
}

export function translateWordList(words) {
  const result = [];
  for (let i = 0; i < words.length; i++) {
    result.push(translateWord(words[i]));
  }
  return result;
}

export function nodeColorOf(node) {
  return NODE_COLORS[node.group] || NODE_COLORS.effect;
}

export function hasNodeWithGroupAndId(nodes, group, rawId) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].rawId !== rawId) continue;
    if (nodes[i].group === group || nodes[i].group === "both") return true;
  }
  return false;
}

export function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x === undefined || x === null || x === "") return [];

  const parts = String(x).split(",");
  const result = [];

  for (let i = 0; i < parts.length; i++) {
    const trimmed = parts[i].trim();
    if (trimmed !== "") result.push(trimmed);
  }
  return result;
}

export function buildCurrentLevels(monthRow) {
  const levels = {};

  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    const field = SEARCH_FIELDS[i];

    if (!monthRow || monthRow[field] == null) {
      levels[field] = "NoData";
      continue;
    }

    const value = parseFloat(monthRow[field]);
    if (isNaN(value)) {
      levels[field] = "NoData";
      continue;
    }

    levels[field] = value >= SEARCH_INDEX_MIN ? "High" : "NotHigh";
  }

  if (monthRow && monthRow.average_rain != null) {
    levels.rain = isHighFloodRisk(monthRow.average_rain) ? "High" : "NotHigh";
  } else {
    levels.rain = "NoData";
  }

  return levels;
}

export function getItemLevel(item, levels) {
  if (item === "rain_level_High") return levels.rain;
  return levels[item];
}

export function checkRule(rule, levels) {
  const items = asArray(rule.antecedents).concat(asArray(rule.consequents));
  let hasNoData = false;

  for (let i = 0; i < items.length; i++) {
    const level = getItemLevel(items[i], levels);

    if (level === "NoData" || level === undefined) {
      hasNoData = true;
      continue;
    }

    if (level !== "High") return "NotMatched";
  }

  if (hasNoData) return "Undetermined";
  return "Matched";
}

function makeRuleKey(rule) {
  const antecedents = asArray(rule.antecedents).slice().sort();
  const consequents = asArray(rule.consequents).slice().sort();
  return antecedents.join(",") + "=>" + consequents.join(",");
}

export function getRulesForProvinceMonth(rules, province, month) {
  const result = [];
  const seen = new Set();
  const targetMonth = parseInt(month);

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (rule.province !== province) continue;
    if (parseInt(rule.month) !== targetMonth) continue;

    const key = makeRuleKey(rule);
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(rule);
  }

  return result;
}

export function getMatchingRules(rules, levels) {
  const result = [];
  for (let i = 0; i < rules.length; i++) {
    if (checkRule(rules[i], levels) === "Matched") {
      result.push(rules[i]);
    }
  }

  result.sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
  return result;
}

export function filterRulesByConfidence(rules, threshold) {
  const result = [];
  for (let i = 0; i < rules.length; i++) {
    if ((rules[i].confidence || 0) >= threshold) {
      result.push(rules[i]);
    }
  }
  return result;
}

export function joinThaiList(parts) {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} และ ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} และ ${parts[parts.length - 1]}`;
}

export function searchBehaviorCategoryPhrase(category, fieldsInCategory) {
  if (category === "flood") return "น้ำท่วม";
  if (category === "rain") return "ฝนตกหนัก";
  if (category === "storm") return "พายุเข้าไทย";

  if (category === "water_watch") {
    const hasLevel = fieldsInCategory.includes("search_water_level");
    const hasSituation = fieldsInCategory.includes("search_water_situation");
    if (hasLevel && hasSituation) return "การติดตามสถานการณ์น้ำ";
    if (hasLevel) return "การติดตามระดับน้ำ";
    return "การติดตามสถานการณ์น้ำ";
  }

  return "การรับมือหรือการอพยพ";
}

export function searchBehaviorPhraseList(highFields) {
  const byCategory = {};

  for (let i = 0; i < highFields.length; i++) {
    const cat = SEARCH_BEHAVIOR_CATEGORY[highFields[i]];
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(highFields[i]);
  }

  const phrases = [];
  for (let i = 0; i < SEARCH_BEHAVIOR_CATEGORY_ORDER.length; i++) {
    const cat = SEARCH_BEHAVIOR_CATEGORY_ORDER[i];
    if (byCategory[cat]) {
      phrases.push(searchBehaviorCategoryPhrase(cat, byCategory[cat]));
    }
  }

  return phrases;
}

export function describeSearchBehaviorSummary(highFields) {
  if (highFields.length === 0) return "";
  const phrases = searchBehaviorPhraseList(highFields);
  return `เดือนนี้มีการค้นหาเกี่ยวกับ${joinThaiList(phrases)}`;
}

export const SEARCH_BEHAVIOR_CATEGORY = {
  search_flood: "flood", search_rain: "rain", search_storm: "storm",
  search_water_level: "water_watch", search_water_situation: "water_watch", search_evacuate: "response",
};

export const SEARCH_BEHAVIOR_CATEGORY_ORDER = ["flood", "rain", "storm", "water_watch", "response"];
