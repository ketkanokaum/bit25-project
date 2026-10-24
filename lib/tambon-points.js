
export const TAMBON_POINTS_URL = '/geo/tambon-points.json';

const DISTRICT_ALIASES = {
  'ยะลา|กรงปินัง': 'กรงปีนัง',
};

function cleanName(value) {
  if (!value) return '';
  let text = String(value).trim();
  text = text.replace(/^แขวง\s*/, '');
  return text.trim();
}

function makeKey(province, district, subdistrict) {
  if (subdistrict) {
    return province + '|' + district + '|' + subdistrict;
  }
  return province + '|' + district;
}

function applyAlias(province, district) {
  const alias = DISTRICT_ALIASES[province + '|' + district];
  if (alias) return alias;
  return district;
}

export function buildPointIndex(points) {
  const tambons = {};
  const districtSums = {};

  for (let i = 0; i < points.length; i++) {
    const row = points[i];
    if (!row || !row.p || !row.a || !row.t) continue;

    const lat = Number(row.lat);
    const lon = Number(row.lon);
    if (!isFinite(lat) || !isFinite(lon)) continue;

    tambons[makeKey(row.p, row.a, row.t)] = { lat: lat, lon: lon };

    const districtKey = makeKey(row.p, row.a);

    if (!districtSums[districtKey]) {
      districtSums[districtKey] = { lat: 0, lon: 0, count: 0 };
    }
    districtSums[districtKey].lat += lat;
    districtSums[districtKey].lon += lon;
    districtSums[districtKey].count += 1;
  }

  const districts = {};
  for (const key in districtSums) {
    const sum = districtSums[key];
    districts[key] = { lat: sum.lat / sum.count, lon: sum.lon / sum.count };
  }

  return { tambons: tambons, districts: districts };
}

function findPoint(index, province, district, subdistrict) {
  if (!index) return null;

  const cleanProvince = cleanName(province);
  const cleanDistrict = cleanName(district);
  const cleanSubdistrict = cleanName(subdistrict);
  const mappedDistrict = applyAlias(cleanProvince, cleanDistrict);

  if (cleanSubdistrict) {
    const tambonKey = makeKey(
      cleanProvince,
      mappedDistrict,
      cleanSubdistrict
    );
    const tambonPoint = index.tambons[tambonKey];

    if (tambonPoint) {
      return {
        lat: tambonPoint.lat,
        lon: tambonPoint.lon,
        level: 'tambon',
      };
    }
  }

  const districtKey = makeKey(cleanProvince, mappedDistrict);
  const districtPoint = index.districts[districtKey];

  if (districtPoint) {
    return {
      lat: districtPoint.lat,
      lon: districtPoint.lon,
      level: 'district',
    };
  }

  return null;
}

export function buildFloodMarkers(districts, index, province) {
  const markers = [];
  const unmatched = [];

  for (let i = 0; i < districts.length; i++) {
    const district = districts[i];

    for (let j = 0; j < district.subdistricts.length; j++) {
      const subdistrict = district.subdistricts[j];
      const point = findPoint(index, province, district.name, subdistrict.name);

      if (!point) {
        unmatched.push({
          district: district.name,
          subdistrict: subdistrict.name,
          mooText: subdistrict.mooText,
        });
        continue;
      }

      markers.push({
        key: district.name + '|' + subdistrict.name,
        lat: point.lat,
        lon: point.lon,
        level: point.level,
        district: district.name,
        subdistrict: subdistrict.name,
        mooText: subdistrict.mooText,
        years: district.years,
        latestDate: district.latestDate,
      });
    }
  }

  return { markers: markers, unmatched: unmatched };
}


export function getMarkersCenter(markers) {
  if (markers.length === 0) return null;

  let lat = 0;
  let lon = 0;
  for (let i = 0; i < markers.length; i++) {
    lat += markers[i].lat;
    lon += markers[i].lon;
  }
  return { lat: lat / markers.length, lon: lon / markers.length };
}
