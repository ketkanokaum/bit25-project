
export const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];
export const RULE_BASE_YEARS = REAL_DATA_YEARS;
export const LAST_REAL_YEAR = REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1];

export const METHOD_CONFIRMED = "confirmed";
export const METHOD_MODEL = "model";
export const METHOD_CLIMATOLOGY = "climatology";


export const METHOD_LABELS = {
  [METHOD_CONFIRMED]: "สถิติที่เกิดขึ้นจริง",
  [METHOD_MODEL]: "ระดับการเฝ้าระวังสำหรับเดือน",
  [METHOD_CLIMATOLOGY]: "ระดับจากประวัติย้อนหลัง",
};

// ที่มาของระดับที่แสดง ต้องแยกให้ชัดว่าเป็นคนละอย่างกัน
//   historical_plus_search = ประวัติอุทกภัย + พฤติกรรมการค้นหาของเดือนนั้น
//   historical_only        = ประวัติอุทกภัยอย่างเดียว ยังไม่มีการปรับจากการค้นหา
export const ASSESSMENT_HISTORICAL_PLUS_SEARCH = "historical_plus_search";
export const ASSESSMENT_HISTORICAL_ONLY = "historical_only";

export const ASSESSMENT_LABELS = {
  [ASSESSMENT_HISTORICAL_PLUS_SEARCH]: "ประวัติอุทกภัย + พฤติกรรมการค้นหา",
  [ASSESSMENT_HISTORICAL_ONLY]: "ประวัติอุทกภัยย้อนหลังเท่านั้น",
};

export const SEARCH_FIELDS = [
  "search_flood",
  "search_rain",
  "search_storm",
  "search_water_level",
  "search_water_situation",
  "search_evacuate",
];

export const SEARCH_LABELS = {
  search_flood: "น้ำท่วม",
  search_rain: "ฝนตก",
  search_storm: "พายุ",
  search_water_level: "ระดับน้ำ",
  search_water_situation: "สถานการณ์น้ำ",
  search_evacuate: "อพยพ",
};

function yearMonthKey(year, month) {
  return parseInt(year) * 12 + (parseInt(month) - 1);
}

function decodeYearMonthKey(key) {
  return { year: Math.floor(key / 12), month: (key % 12) + 1 };
}

export function getDataBoundaries(data) {
  let searchEndKey = -1;
  let rainEndKey = -1;

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const key = yearMonthKey(r.year, r.month);

    let hasAllSearch = true;
    for (let f = 0; f < SEARCH_FIELDS.length; f++) {
      if (r[SEARCH_FIELDS[f]] == null) {
        hasAllSearch = false;
        break;
      }
    }
    if (hasAllSearch && key > searchEndKey) searchEndKey = key;
    if (r.average_rain != null && key > rainEndKey) rainEndKey = key;
  }

  const searchEnd = searchEndKey >= 0 ? decodeYearMonthKey(searchEndKey) : { year: 0, month: 0 };
  const rainEnd = rainEndKey >= 0 ? decodeYearMonthKey(rainEndKey) : { year: 0, month: 0 };

  let lastSelectableYear = LAST_REAL_YEAR;
  if (rainEnd.year > lastSelectableYear) lastSelectableYear = rainEnd.year;
  if (searchEnd.year > lastSelectableYear) lastSelectableYear = searchEnd.year;

  return {
    searchEndYear: searchEnd.year,
    searchEndMonth: searchEnd.month,
    rainEndYear: rainEnd.year,
    rainEndMonth: rainEnd.month,
    lastSelectableYear,
  };
}

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
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (
      r.province === province &&
      parseInt(r.month) === parseInt(month) &&
      r.baseline_mean != null &&
      r.baseline_mean !== ""
    ) {
      return { value: Math.round(parseFloat(r.baseline_mean)), fromTable: true };
    }
  }
  return { value: null, fromTable: false };
}

// แบ่งค่าออกเป็น 3 ส่วนเท่าๆ กัน ค่าที่เกินขีดนี้ถือว่าอยู่ในส่วนบนสุด
const SEARCH_HIGH_QUANTILE = 2 / 3;

// ต้องมีข้อมูลย้อนหลังอย่างน้อย 1 ปีเต็ม ขีดแบ่งจึงจะเชื่อถือได้
const MIN_PAST_MONTHS = 12;

// เปอร์เซ็นไทล์แบบ linear interpolation (ให้ผลตรงกับ numpy.quantile ค่าเริ่มต้น
// ที่ใช้ตอนแบ่งกลุ่มในโน้ตบุ๊ก)
function quantile(sortedValues, q) {
  const n = sortedValues.length;
  if (n === 0) return null;
  if (n === 1) return sortedValues[0];
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedValues[lo];
  return sortedValues[lo] + (sortedValues[hi] - sortedValues[lo]) * (pos - lo);
}

// รวบรวมแถวรายเดือนของจังหวัดหนึ่งที่มีข้อมูลการค้นหาครบทั้ง 6 คำ
// เฉพาะปีก่อนหน้าปีที่กำลังประเมิน และตัดเดือนซ้ำออก
// (หนึ่งเดือนอาจมีหลายแถวได้ ถ้าเดือนนั้นมีอุทกภัยหลายเหตุการณ์)
function collectPastSearchMonths(data, province, year) {
  const months = new Map();
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (r.province !== province) continue;
    if (parseInt(r.year) >= parseInt(year)) continue;

    const key = yearMonthKey(r.year, r.month);
    if (months.has(key)) continue;

    let hasAll = true;
    for (let f = 0; f < SEARCH_FIELDS.length; f++) {
      if (r[SEARCH_FIELDS[f]] == null) {
        hasAll = false;
        break;
      }
    }
    if (hasAll) months.set(key, r);
  }
  return Array.from(months.values());
}

// นับว่าเดือนนั้นมีคำค้นหากี่คำ (จาก 6 คำ) ที่สูงกว่าระดับปกติของจังหวัดนั้น
//
// "สูงกว่าระดับปกติ" = เกินเปอร์เซ็นไทล์ที่ 67 ของคำนั้นในจังหวัดเดียวกัน ซึ่งเป็น
// นิยามเดียวกับการแบ่งกลุ่มก่อนหาความสัมพันธ์ใน association_rules.ipynb
//
// ขีดแบ่ง (threshold) คำนวณจากปีก่อนหน้า "year" ที่ส่งเข้ามาเท่านั้น ไม่ว่าจะ
// เรียกด้วยเดือน/ปีไหนก็ตาม — เพื่อไม่ให้ขีดแบ่งเห็นข้อมูลของปีเป้าหมายเองหรือ
// อนาคต (data leakage ที่ชั้น threshold) จุดนี้แยกจากคำถามว่า "ค่าที่เอามาเทียบ
// กับขีดแบ่ง" เป็นเดือนไหน — predictFlood() ด้านล่างเรียกฟังก์ชันนี้ด้วยเดือน/ปี
// ที่กำลังประเมินตรงๆ (current-month assessment) ไม่ใช่เดือนก่อนหน้าอีกต่อไป
// แต่ขีดแบ่งก็ยังคงไม่เห็นปีเป้าหมายเช่นเดิม เพราะเป็นคนละกลไกกัน
//
// ต้องแยกขีดแบ่งรายจังหวัด เพราะดัชนีของ Google Trends เป็นค่าสัมพัทธ์ภายใน
// พื้นที่ ค่า 40 ของกรุงเทพฯ กับค่า 40 ของแม่ฮ่องสอนจึงเทียบกันตรงๆ ไม่ได้
// คืนรายละเอียดรายคำ ไม่ใช่แค่จำนวน เพื่อให้หน้าเว็บบอกได้ว่าคำไหนสูงและสูงเท่าไร
// { count, terms: [{ field, label, value, normal, isHigh }] } หรือ null ถ้าข้อมูลไม่พอ
//
// ฟังก์ชันเดียวนี้ใช้ทั้งเป็น feature ของ Logistic Regression (เรียกจาก
// predictFlood()) และใช้แสดงผลบนหน้าเว็บ (เรียกจาก FloodSearchPatterns.js เพื่อ
// สร้าง currentLevels/targetSearchHighCount) — ตั้งใจให้เป็นจุดเดียว (single
// source of truth) กันไม่ให้ตัวเลขที่โมเดลใช้จริงกับตัวเลขที่ผู้ใช้เห็นไม่ตรงกัน
export function getSearchDetail(data, province, year, month) {
  const row = getMonthRow(data, province, year, month);
  if (!row) return null;
  for (let f = 0; f < SEARCH_FIELDS.length; f++) {
    if (row[SEARCH_FIELDS[f]] == null) return null;
  }

  const pastMonths = collectPastSearchMonths(data, province, year);
  if (pastMonths.length < MIN_PAST_MONTHS) return null;

  const terms = [];
  let count = 0;
  for (let f = 0; f < SEARCH_FIELDS.length; f++) {
    const field = SEARCH_FIELDS[f];
    const values = [];
    for (let i = 0; i < pastMonths.length; i++) {
      values.push(Number(pastMonths[i][field]));
    }
    values.sort(function (a, b) {
      return a - b;
    });
    const normal = quantile(values, SEARCH_HIGH_QUANTILE);
    const value = Number(row[field]);
    const isHigh = value > normal;
    if (isHigh) count++;
    terms.push({ field, label: SEARCH_LABELS[field], value, normal, isHigh });
  }
  return { count, terms };
}

// ===== Monitoring Assessment สำหรับปี 2568-2569 =====
//
// ใช้ช่วงอ้างอิงคงที่ พ.ศ. 2563-2567 (REAL_DATA_YEARS) เหมือนกันทั้งปี 2568
// และ 2569 ไม่ขยายตามปีเป้าหมาย เพื่อให้ทั้งสองปีถูกประเมินจากฐานเดียวกัน
//
// ต่างจาก getSearchDetail() ด้านบนตรงที่:
//   getSearchDetail()  -> ขีดแบ่งจากค่าทุกค่ารวมศูนย์ ของปีก่อนปีเป้าหมาย
//                         (ใช้กับ Association Rules เท่านั้น ห้ามแก้)
//   ฟังก์ชันชุดนี้      -> ขีดแบ่งจากเฉพาะค่าที่มากกว่าศูนย์ ของช่วงอ้างอิงคงที่
//
// เหตุผลที่ต้องใช้เฉพาะค่าที่มากกว่าศูนย์: เปอร์เซ็นไทล์ที่ 67 ของค่าทั้งหมด
// เป็น 0 ถึง 409 จาก 462 คู่จังหวัด-คำ (88.5%) ทำให้คำว่า "สูงกว่าปกติ"
// กลายเป็นเพียง "มีการค้นหา" ซึ่งไม่ตรงความหมายที่ต้องการ

export const KEYWORD_NO_ACTIVITY = "NoActivity";
export const KEYWORD_ACTIVITY = "Activity";
export const KEYWORD_ELEVATED = "Elevated";
export const KEYWORD_ACTIVITY_NO_REF = "ActivityNoRef";

// รวบรวมเดือนของจังหวัดหนึ่งในช่วงอ้างอิงคงที่ 2563-2567 ที่มีข้อมูลครบ 6 คำ
// ตัดเดือนซ้ำออก (หนึ่งเดือนอาจมีหลายแถวถ้าเดือนนั้นมีอุทกภัยหลายเหตุการณ์)
function collectReferenceSearchMonths(data, province) {
  const months = new Map();
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (r.province !== province) continue;
    if (!REAL_DATA_YEARS.includes(parseInt(r.year))) continue;

    const key = yearMonthKey(r.year, r.month);
    if (months.has(key)) continue;

    let hasAll = true;
    for (let f = 0; f < SEARCH_FIELDS.length; f++) {
      if (r[SEARCH_FIELDS[f]] == null) {
        hasAll = false;
        break;
      }
    }
    if (hasAll) months.set(key, r);
  }
  return Array.from(months.values());
}

// เปอร์เซ็นไทล์ที่ 67 ของเฉพาะค่าที่มากกว่าศูนย์
// คืน null ถ้าไม่มีค่าที่มากกว่าศูนย์เลยในช่วงอ้างอิง (ยังไม่มีเกณฑ์เทียบ)
function getPositiveP67(values) {
  const positives = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0) positives.push(values[i]);
  }
  if (positives.length === 0) return null;
  positives.sort(function (a, b) {
    return a - b;
  });
  return quantile(positives, SEARCH_HIGH_QUANTILE);
}

// สถานะการค้นหาของคำหนึ่งในเดือนหนึ่ง เทียบกับช่วงอ้างอิงคงที่
export function getSearchActivityDetail(data, province, year, month) {
  const row = getMonthRow(data, province, year, month);
  if (!row) return null;
  for (let f = 0; f < SEARCH_FIELDS.length; f++) {
    if (row[SEARCH_FIELDS[f]] == null) return null;
  }

  const referenceMonths = collectReferenceSearchMonths(data, province);
  if (referenceMonths.length === 0) return null;

  const terms = [];
  let elevatedCount = 0;
  let noRefCount = 0;

  for (let f = 0; f < SEARCH_FIELDS.length; f++) {
    const field = SEARCH_FIELDS[f];
    const values = [];
    for (let i = 0; i < referenceMonths.length; i++) {
      values.push(Number(referenceMonths[i][field]));
    }
    const threshold = getPositiveP67(values);
    const value = Number(row[field]);

    let status;
    if (value === 0) {
      status = KEYWORD_NO_ACTIVITY;
    } else if (threshold === null) {
      // มีการค้นหาในเดือนนี้ แต่ช่วงอ้างอิงไม่เคยมีค่ามากกว่าศูนย์เลย
      // จึงไม่มีเกณฑ์ให้เทียบ ห้ามนับเป็น Elevated
      status = KEYWORD_ACTIVITY_NO_REF;
      noRefCount++;
    } else if (value > threshold) {
      status = KEYWORD_ELEVATED;
      elevatedCount++;
    } else {
      status = KEYWORD_ACTIVITY;
    }

    terms.push({ field, label: SEARCH_LABELS[field], value, threshold, status });
  }

  return {
    terms,
    elevatedCount,
    noRefCount,
    // สัญญาณแบบสองสถานะ: มีคำใดคำหนึ่งสูงกว่าเกณฑ์หรือไม่
    // ไม่ใช้จำนวนคำมาคิดคะแนน เพราะช่วง 3 คำขึ้นไปมีข้อมูลน้อยเกินไป
    hasElevatedSignal: elevatedCount > 0,
  };
}

// ตารางระดับเฝ้าระวัง
// ประวัติการเกิดอุทกภัยเป็นตัวหลัก พฤติกรรมการค้นหาเป็นตัวประกอบที่ช่วยยกระดับ
//
//   เคยท่วม 0 ปี  ไม่มีสัญญาณ -> ต่ำ      มีสัญญาณ -> ต่ำ
//   เคยท่วม 1 ปี  ไม่มีสัญญาณ -> ต่ำ      มีสัญญาณ -> ปานกลาง
//   เคยท่วม 2 ปี  ไม่มีสัญญาณ -> ปานกลาง  มีสัญญาณ -> สูง
//   เคยท่วม 3 ปี  ไม่มีสัญญาณ -> ปานกลาง  มีสัญญาณ -> สูง
//   เคยท่วม 4 ปี  ไม่มีสัญญาณ -> สูง      มีสัญญาณ -> สูง
//   เคยท่วม 5 ปี  ไม่มีสัญญาณ -> สูง      มีสัญญาณ -> สูง
// ระดับจากประวัติอุทกภัยอย่างเดียว ใช้เมื่อเดือนนั้นยังไม่มีข้อมูลการค้นหา
// ไม่ใช่ระดับเดียวกับ getMonitoringLevel() ด้านล่าง เพราะยังไม่ได้ผ่านการ
// พิจารณาพฤติกรรมการค้นหา จึงต้องกำกับที่มาให้ผู้ใช้เห็นเสมอ
//
//   เคยท่วม 0-1 ปี -> ต่ำ
//   เคยท่วม 2-3 ปี -> ปานกลาง
//   เคยท่วม 4-5 ปี -> สูง
export function getHistoricalLevel(floodCount) {
  if (floodCount == null) return null;
  if (floodCount <= 1) return "low";
  if (floodCount <= 3) return "medium";
  return "high";
}

export function getMonitoringLevel(floodCount, hasElevatedSignal) {
  if (floodCount == null) return null;

  if (floodCount === 0) return "low";
  if (floodCount === 1) return hasElevatedSignal ? "medium" : "low";
  if (floodCount === 2) return hasElevatedSignal ? "high" : "medium";
  if (floodCount === 3) return hasElevatedSignal ? "high" : "medium";
  return "high";
}

// แปลง key เป็นรายละเอียดระดับ (สี ป้าย คำแนะนำ) ที่หน้าเว็บใช้อยู่เดิม
export function getMonitoringLevelInfo(key) {
  if (key == null) return null;
  for (let i = 0; i < RISK_LEVELS.length; i++) {
    if (RISK_LEVELS[i].key === key) return RISK_LEVELS[i];
  }
  return null;
}

// คำแนะนำของแต่ละระดับเป็นการชี้ไปยังแหล่งข้อมูลทางการ ไม่ใช่คำสั่งปฏิบัติ
// ที่คิดขึ้นเอง เพราะระบบนี้เป็นเครื่องมือประกอบการเฝ้าระวังเชิงวิชาการ
// ไม่ใช่ระบบเตือนภัยที่มีอำนาจตามกฎหมาย
export const OFFICIAL_SOURCES = [
  { name: "กรมป้องกันและบรรเทาสาธารณภัย", url: "https://www.disaster.go.th" },
  { name: "คลังข้อมูลน้ำแห่งชาติ", url: "https://www.thaiwater.net" },
  { name: "กรมอุตุนิยมวิทยา", url: "https://www.tmd.go.th" },
];

export const DISCLAIMER =
  "ข้อมูลนี้ใช้ประกอบการเฝ้าระวัง ไม่ทดแทนประกาศจากหน่วยงานทางการ";

// อ้างอิงแนวทางเตรียมความพร้อมจากประกาศของ ปภ. ที่เผยแพร่ผ่านสำนักงาน
// ประชาสัมพันธ์จังหวัดอุทัยธานี — เป็นแนวทางทั่วไปที่ ปภ. เผยแพร่จริง
// ไม่ใช่คำแนะนำเฉพาะเจาะจงที่ระบบนี้คิดขึ้นเอง
// export const ADVICE_SOURCE = {
//   label: "คำแนะนำของ ปภ. เรื่องการเตรียมพร้อมรับมืออุทกภัย",
//   url: "https://uthaithani.prd.go.th/th/content/category/detail/id/9/iid/51229",
// };

// ห้ามใช้คำว่า "ให้อพยพทันที" หรือคำสั่งเฉพาะเจาะจงอื่นๆ ที่มาจากผลโมเดล
// เพราะระบบนี้เป็นเพียงเครื่องมือเฝ้าระวังทางวิชาการ ไม่ใช่หน่วยงานที่มี
// อำนาจสั่งอพยพ — การตัดสินใจอพยพต้องอ้างอิงประกาศทางการเท่านั้น
export const RISK_LEVELS = [
  {
    tier: 1,
    key: "low",
    label: "เฝ้าระวังต่ำ",
    chanceLabel: "น้อย",
    range: "< 33.33%",

    observedRate: 7.4,
    advice: {
      title: "ติดตามสถานการณ์ตามปกติ",
      bullets: [
        "ตรวจสอบพยากรณ์อากาศเป็นระยะ",
        "ติดตามข่าวสารจากหน่วยงานในพื้นที่",
        "ยังไม่จำเป็นต้องเตรียมการเป็นพิเศษ",
      ],
    },
    hex: { color: "#15803d", bg: "#f0fdf4", border: "#86efac", dot: "#22c55e" },
    tw: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  },
  {
    tier: 2,
    key: "medium",
    label: "เฝ้าระวังปานกลาง",
    chanceLabel: "ปานกลาง",
    range: "33.33% – < 66.67%",
    observedRate: 26.2,
    advice: {
      title: "เริ่มเตรียมความพร้อม",
      bullets: [
        "ติดตามสภาพอากาศและระดับน้ำอย่างสม่ำเสมอ",
        "เตรียมยา เอกสารสำคัญ และของจำเป็น",
        "ตรวจสอบทางระบายน้ำรอบบ้าน",
        "วางแผนเคลื่อนย้ายทรัพย์สินหากระดับน้ำเพิ่มขึ้น",
      ],
    },
    hex: { color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
    tw: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  },
  {
    tier: 3,
    key: "high",
    label: "เฝ้าระวังสูง",
    chanceLabel: "มาก",
    range: "≥ 66.67%",
    observedRate: 67.5,
    advice: {
      title: "เตรียมพร้อมรับสถานการณ์",
      bullets: [
        "ติดตามประกาศเตือนภัยอย่างใกล้ชิด",
        "เตรียมกระเป๋าฉุกเฉินและยาประจำตัว",
        "ย้ายสิ่งของสำคัญขึ้นที่สูง",
        "ตรวจสอบเส้นทางและจุดอพยพ",
        "ปฏิบัติตามประกาศของหน่วยงานในพื้นที่ทันที",
      ],

    
    },
    hex: { color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
    tw: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  },
];


export function predictFlood(data, province, year, month) {
  const y = parseInt(year);
  const m = parseInt(month);
  const history = countFloodYears(data, province, m);

  // ปีที่มีข้อมูลยืนยันแล้ว — ไม่ต้องประเมิน ใช้เหตุการณ์จริง
  if (REAL_DATA_YEARS.includes(y)) {
    const events = getFloodEvents(data, province, y, m);
    return {
      method: METHOD_CONFIRMED,
      label: METHOD_LABELS[METHOD_CONFIRMED],
      score: events.length > 0 ? 1 : 0,
      occurred: events.length > 0,
      requiresMonitoring: events.length > 0,
      history: history,
      note: "",
    };
  }

  const floodYears = history.count;

  // พฤติกรรมการค้นหาของเดือนที่กำลังประเมิน เทียบกับช่วงอ้างอิงคงที่ 2563-2567
  const activity = getSearchActivityDetail(data, province, y, m);

  // ไม่มีข้อมูลการค้นหาของเดือนนี้ -> ประเมินระดับร่วมไม่ได้
  // แต่ยังบอกประวัติการเกิดอุทกภัยย้อนหลังได้ตามปกติ
  // "ไม่มีข้อมูล" ไม่เท่ากับ "ไม่มีสัญญาณ" จึงห้ามคืนระดับต่ำ
  if (activity === null) {
    const historicalLevel = getHistoricalLevel(floodYears);
    return {
      method: METHOD_CLIMATOLOGY,
      label: METHOD_LABELS[METHOD_CLIMATOLOGY],
      assessmentType: ASSESSMENT_HISTORICAL_ONLY,
      historicalLevel: historicalLevel,
      monitoringLevel: null,
      score: null,
      occurred: null,
      requiresMonitoring: historicalLevel === "medium" || historicalLevel === "high",
      history: history,
      searchDataAvailable: false,
      searchTerms: null,
      elevatedCount: null,
      noRefCount: null,
      hasElevatedSignal: null,
      searchHighTotal: SEARCH_FIELDS.length,
    };
  }

  const monitoringLevel = getMonitoringLevel(floodYears, activity.hasElevatedSignal);
  return {
    method: METHOD_MODEL,
    label: METHOD_LABELS[METHOD_MODEL],
    assessmentType: ASSESSMENT_HISTORICAL_PLUS_SEARCH,
    historicalLevel: null,
    monitoringLevel: monitoringLevel,
    score: null,
    occurred: null,
    requiresMonitoring: monitoringLevel === "medium" || monitoringLevel === "high",
    history: history,
    searchDataAvailable: true,
    searchTerms: activity.terms,
    elevatedCount: activity.elevatedCount,
    noRefCount: activity.noRefCount,
    hasElevatedSignal: activity.hasElevatedSignal,
    searchHighTotal: SEARCH_FIELDS.length,
    note: "",
  };
}
