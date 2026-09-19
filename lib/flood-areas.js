function extractMooNumber(moo) {
  const match = String(moo).match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return null;
}

export function formatMooList(mooNumbers, hasUnspecified) {
  const sorted = Array.from(mooNumbers);
  sorted.sort((a, b) => a - b);
  let text = "";

  if (sorted.length === 1) {
    text = `หมู่ ${sorted[0]}`;
  } else if (sorted.length === 2) {
    text = `หมู่ ${sorted[0]} และ ${sorted[1]}`;
  } else if (sorted.length > 2) {
    const lastMoo = sorted[sorted.length - 1];
    const beforeLast = sorted.slice(0, -1).join(", ");
    text = `หมู่ ${beforeLast} และ ${lastMoo}`;
  }

  if (hasUnspecified) {
    if (text !== "") {
      text += " และพื้นที่อื่นที่ไม่ระบุหมู่บ้าน";
    } else {
      text = "ไม่ระบุหมู่บ้าน";
    }
  }

  return text;
}

export function groupReportedAreas(events, scope) {
  const province = scope.province;
  const month = scope.month;
  const years = scope.years;

  const districtMap = new Map();
  let hasEvents = false;
  let hasAreaDetail = false;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    const sameProvince = event.province === province;
    const sameMonth = parseInt(event.month) === parseInt(month);
    const sameYear = years.includes(parseInt(event.year));

    if (!sameProvince || !sameMonth || !sameYear) {
      continue;
    }

    hasEvents = true;

    if (!event.district) {
      continue;
    }

    hasAreaDetail = true;

    const districtName = event.district;
    const subdistrictName = event.subdistrict || "ไม่ระบุตำบล";

    if (!districtMap.has(districtName)) {
      districtMap.set(districtName, {
        subdistricts: new Map(),
        years: new Set(),
        latestDate: null,
      });
    }

    const district = districtMap.get(districtName);

    district.years.add(parseInt(event.year));

    if (
      event.date &&
      (!district.latestDate || event.date > district.latestDate)
    ) {
      district.latestDate = event.date;
    }

    if (!district.subdistricts.has(subdistrictName)) {
      district.subdistricts.set(subdistrictName, {
        moos: new Set(),
        hasUnspecified: false,
      });
    }

    const subdistrict = district.subdistricts.get(subdistrictName);

    if (event.moo) {
      const mooNumber = extractMooNumber(event.moo);

      if (mooNumber !== null) {
        subdistrict.moos.add(mooNumber);
      } else {
        subdistrict.hasUnspecified = true;
      }
    } else {
      subdistrict.hasUnspecified = true;
    }
  }

  if (!hasEvents) {
    return {
      hasEvents: false,
      hasAreaDetail: false,
      districts: [],
    };
  }

  if (!hasAreaDetail) {
    return {
      hasEvents: true,
      hasAreaDetail: false,
      districts: [],
    };
  }

  const districts = [];

  for (const [districtName, district] of districtMap) {
    const subdistricts = [];
    let villageCount = 0;

    for (const [subdistrictName, subdistrict] of district.subdistricts) {
      const mooList = Array.from(subdistrict.moos);

      villageCount += mooList.length;

      if (subdistrict.hasUnspecified) {
        villageCount++;
      }

      subdistricts.push({
        name: subdistrictName,
        mooText: formatMooList(
          mooList,
          subdistrict.hasUnspecified
        ),
      });
    }

    subdistricts.sort((a, b) =>
      a.name.localeCompare(b.name, "th")
    );

    const districtYears = Array.from(district.years);
    districtYears.sort((a, b) => a - b);

    districts.push({
      name: districtName,
      subdistrictCount: subdistricts.length,
      villageCount: villageCount,
      subdistricts: subdistricts,
      years: districtYears,
      latestDate: district.latestDate,
    });
  }

  districts.sort((a, b) => {
    if (a.villageCount !== b.villageCount) {
      return b.villageCount - a.villageCount;
    }

    return a.name.localeCompare(b.name, "th");
  });

  return {
    hasEvents: true,
    hasAreaDetail: true,
    districts: districts,
  };
}