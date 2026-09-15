

const UNSPECIFIED_VILLAGE = "__unspecified__";

function extractMooNumber(moo) {
  const match = String(moo).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// จัด list หมู่ให้เป็นข้อความภาษาไทย: "หมู่ 1, 3 และ 4"
export function formatMooList(mooNumbers, hasUnspecified) {
  const sorted = [...mooNumbers].sort((a, b) => a - b);
  let text = "";
  if (sorted.length === 1) {
    text = `หมู่ ${sorted[0]}`;
  } else if (sorted.length === 2) {
    text = `หมู่ ${sorted[0]} และ ${sorted[1]}`;
  } else if (sorted.length > 2) {
    text = `หมู่ ${sorted.slice(0, -1).join(", ")} และ ${sorted[sorted.length - 1]}`;
  }

  if (hasUnspecified) {
    text = text ? `${text} และพื้นที่อื่นที่ไม่ระบุหมู่บ้าน` : "ไม่ระบุหมู่บ้าน";
  }
  return text;
}


export function groupReportedAreas(events, scope) {
  const { province, month, years } = scope;
  const yearSet = new Set(years);

  const matched = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.province !== province) continue;
    if (parseInt(e.month) !== parseInt(month)) continue;
    if (!yearSet.has(parseInt(e.year))) continue;
    matched.push(e);
  }

  if (matched.length === 0) {
    return { hasEvents: false, hasAreaDetail: false, districts: [] };
  }

  const withDistrict = matched.filter((e) => e.district);
  if (withDistrict.length === 0) {
    return { hasEvents: true, hasAreaDetail: false, districts: [] };
  }

  // districtName -> subdistrictName -> { moos:Set<number>, hasUnspecified, years:Set, latestDate }
  const districtMap = new Map();

  for (let i = 0; i < withDistrict.length; i++) {
    const e = withDistrict[i];
    const dName = e.district;
    const sName = e.subdistrict || "ไม่ระบุตำบล";

    if (!districtMap.has(dName)) {
      districtMap.set(dName, { subdistricts: new Map(), years: new Set(), latestDate: null });
    }
    const dEntry = districtMap.get(dName);
    dEntry.years.add(parseInt(e.year));
    if (e.date && (!dEntry.latestDate || e.date > dEntry.latestDate)) dEntry.latestDate = e.date;

    if (!dEntry.subdistricts.has(sName)) {
      dEntry.subdistricts.set(sName, { moos: new Set(), hasUnspecified: false });
    }
    const sEntry = dEntry.subdistricts.get(sName);
    if (e.moo) {
      const n = extractMooNumber(e.moo);
      if (n != null) sEntry.moos.add(n);
      else sEntry.hasUnspecified = true;
    } else {
      sEntry.hasUnspecified = true;
    }
  }

  const districts = [];
  for (const [dName, dEntry] of districtMap) {
    const subdistricts = [];
    let villageCount = 0;

    for (const [sName, sEntry] of dEntry.subdistricts) {
      const mooList = Array.from(sEntry.moos);
      villageCount += mooList.length + (sEntry.hasUnspecified ? 1 : 0);
      subdistricts.push({
        name: sName,
        mooText: formatMooList(mooList, sEntry.hasUnspecified),
      });
    }
    subdistricts.sort((a, b) => a.name.localeCompare(b.name, "th"));

    districts.push({
      name: dName,
      subdistrictCount: subdistricts.length,
      villageCount,
      subdistricts,
      years: Array.from(dEntry.years).sort((a, b) => a - b),
      latestDate: dEntry.latestDate,
    });
  }

  // เรียงอำเภอที่มีพื้นที่ได้รับผลกระทบเยอะสุดไว้ก่อน ให้เห็นจุดสำคัญทันที
  districts.sort((a, b) => b.villageCount - a.villageCount || a.name.localeCompare(b.name, "th"));

  return { hasEvents: true, hasAreaDetail: true, districts };
}
