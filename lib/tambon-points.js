// พิกัดตำบลสำหรับวางหมุดบนแผนที่พื้นที่ที่เคยเกิดอุทกภัย
//
// ชุดข้อมูล : "พิกัดตำบล อำเภอ จังหวัดของประเทศ" โดยกรมการปกครอง
// เผยแพร่   : GISTDA · ลิขสิทธิ์ DGA Open Government License
// ไฟล์ที่ใช้ : public/geo/tambon-points.json (7,364 ตำบล 928 อำเภอ 77 จังหวัด)

export const TAMBON_POINTS_URL = '/geo/tambon-points.json';

// ชื่ออำเภอที่สะกดไม่ตรงกันระหว่างฐานข้อมูลอุทกภัยกับไฟล์พิกัด
// ด้านซ้ายคือชื่อในฐานข้อมูล ด้านขวาคือชื่อในไฟล์พิกัด
// แก้ที่นี่แทนการแก้ไฟล์ข้อมูลดิบที่มาจากหน่วยงานราชการ
const DISTRICT_ALIASES = {
  'ยะลา|กรงปินัง': 'กรงปีนัง',
};

// บางแถวในฐานข้อมูลอุทกภัยเก็บชื่อพร้อมคำนำหน้ามาด้วย เช่น "แขวงคลองเตย"
// ตัดออกก่อนจับคู่ ไม่อย่างนั้นกรุงเทพฯ จะหาพิกัดระดับแขวงไม่เจอเลย
function cleanName(value) {
  if (!value) return '';
  let text = String(value).trim();
  text = text.replace(/^(จ\.|อ\.|ต\.|กิ่งอ\.|เขต|แขวง)\s*/, '');
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

// จัดพิกัดที่โหลดมาให้ค้นหาได้เร็ว พร้อมคำนวณจุดกลางของแต่ละอำเภอไว้ใช้สำรอง
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

// หาพิกัดของตำบล ถ้าไม่เจอให้ถอยไปใช้จุดกลางของอำเภอแทน
export function findPoint(index, province, district, subdistrict) {
  if (!index) return null;

  const cleanProvince = cleanName(province);
  const cleanDistrict = cleanName(district);
  const cleanSubdistrict = cleanName(subdistrict);
  const mappedDistrict = applyAlias(cleanProvince, cleanDistrict);

  if (cleanSubdistrict) {
    const exact = index.tambons[makeKey(cleanProvince, mappedDistrict, cleanSubdistrict)];
    if (exact) {
      return { lat: exact.lat, lon: exact.lon, level: 'tambon' };
    }
  }

  const fallback = index.districts[makeKey(cleanProvince, mappedDistrict)];
  if (fallback) {
    return { lat: fallback.lat, lon: fallback.lon, level: 'district' };
  }

  return null;
}

// แปลงรายการอำเภอที่ได้จาก groupReportedAreas ให้เป็นหมุดบนแผนที่
// ตำบลที่หาพิกัดไม่ได้จะถูกแยกไว้ใน unmatched เพื่อแสดงเป็นรายการแทน ไม่ปล่อยให้หายไป
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

// หาจุดกึ่งกลางของหมุดทั้งหมด ใช้ตั้งตำแหน่งเริ่มต้นของแผนที่
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
