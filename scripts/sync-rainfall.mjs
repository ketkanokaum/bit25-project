

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const RESOURCE_ID = '120aba77-b0a7-44c0-8043-91124dac45ed';
const CKAN_API = 'https://data.hii.or.th/api/3/action';
const PAGE_SIZE = 1000;
const EXPECTED_PROVINCES = 77;

const DRY_RUN = process.argv.includes('--dry-run');

function fail(message) {
  console.error('\n✗ หยุดการทำงาน: ' + message);
  console.error('  ไม่มีการเขียนข้อมูลลงฐานข้อมูล');
  process.exit(1);
}

// ---------- อ่านค่าเชื่อมต่อ ----------

function loadEnv() {
  const localFile = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(localFile)) {
    const lines = fs.readFileSync(localFile, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const matched = lines[i].match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (matched && process.env[matched[1]] === undefined) {
        process.env[matched[1]] = matched[2].replace(/^["']|["']$/g, '');
      }
    }
  }

  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = [];
  for (let i = 0; i < required.length; i++) {
    if (!process.env[required[i]]) missing.push(required[i]);
  }
  if (missing.length > 0) fail('ขาดค่าเชื่อมต่อฐานข้อมูล: ' + missing.join(', '));
}

// ---------- ดึงข้อมูลจากต้นทาง ----------

async function callApi(action, params) {
  const url = new URL(CKAN_API + '/' + action);
  const keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    url.searchParams.set(keys[i], params[keys[i]]);
  }

  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) fail(`เรียก ${action} ไม่สำเร็จ (HTTP ${response.status})`);

  const body = await response.json();
  if (!body.success) fail(`เรียก ${action} ไม่สำเร็จ (success=false)`);
  return body.result;
}

async function fetchAllRecords() {
  const meta = await callApi('resource_show', { id: RESOURCE_ID });
  console.log('แหล่งข้อมูล  :', meta.name || '(ไม่มีชื่อ)');
  console.log('อัปเดตล่าสุด :', meta.last_modified);
  if (!meta.datastore_active) fail('resource นี้ไม่ได้เปิด datastore จึงดึงผ่าน API ไม่ได้');

  const records = [];
  let offset = 0;
  let total = null;

  while (total === null || offset < total) {
    const page = await callApi('datastore_search', {
      resource_id: RESOURCE_ID,
      limit: PAGE_SIZE,
      offset: offset,
    });
    if (total === null) {
      total = page.total;
      console.log('จำนวนแถวต้นทาง :', total);
    }
    if (page.records.length === 0) break;
    for (let i = 0; i < page.records.length; i++) records.push(page.records[i]);
    offset += page.records.length;
  }

  if (records.length !== total) {
    fail(`ดึงข้อมูลได้ไม่ครบ ได้ ${records.length} แถว จากทั้งหมด ${total} แถว`);
  }
  return records;
}

// ---------- แปลงข้อมูล: จับคู่ด้วยชื่อฟิลด์ ไม่ใช้ลำดับคอลัมน์ ----------

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function normalize(records) {
  const needed = ['YEAR', 'MONTH', 'PROV_T', 'MinRain', 'MaxRain', 'AvgRain'];
  const firstRow = records[0] || {};
  const missingFields = [];
  for (let i = 0; i < needed.length; i++) {
    if (!(needed[i] in firstRow)) missingFields.push(needed[i]);
  }
  if (missingFields.length > 0) {
    fail('โครงสร้างข้อมูลต้นทางเปลี่ยนไป ไม่พบฟิลด์: ' + missingFields.join(', ')
       + '\n  ฟิลด์ที่พบจริง: ' + Object.keys(firstRow).join(', '));
  }

  const rows = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const year = toNumber(record.YEAR);
    const month = toNumber(record.MONTH);
    const minRain = toNumber(record.MinRain);
    const maxRain = toNumber(record.MaxRain);
    const avgRain = toNumber(record.AvgRain);
    const province = String(record.PROV_T || '').trim();

    rows.push({
      province: province,
      year: year,
      month: month,
      min_rain: minRain === null ? null : round2(minRain),
      max_rain: maxRain === null ? null : round2(maxRain),
      average_rain: avgRain === null ? null : round2(avgRain),
      date: year + '-' + String(month).padStart(2, '0') + '-01',
    });
  }
  return rows;
}

// ---------- ด่านตรวจ ----------

function gateOneStructure(rows) {
  console.log('\nด่านที่ 1  ความครบถ้วนและความถูกต้องของค่า');
  const problems = [];
  const seen = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const label = `${row.province} ${row.year}-${row.month}`;

    if (!row.province) problems.push('มีแถวที่ไม่มีชื่อจังหวัด');
    if (!(row.year >= 2000 && row.year <= 2100)) problems.push(`${label}: ปีผิดปกติ`);
    if (!(row.month >= 1 && row.month <= 12)) problems.push(`${label}: เดือนผิดปกติ`);

    const values = [row.min_rain, row.max_rain, row.average_rain];
    for (let k = 0; k < values.length; k++) {
      if (values[k] === null) problems.push(`${label}: มีค่าว่างหรือไม่ใช่ตัวเลข`);
      else if (values[k] < 0) problems.push(`${label}: ค่าติดลบ`);
    }

    const key = row.province + '|' + row.year + '|' + row.month;
    if (seen[key]) problems.push(`${label}: มีข้อมูลซ้ำ`);
    seen[key] = true;
  }

  const byMonth = {};
  for (let i = 0; i < rows.length; i++) {
    const key = rows[i].year + '-' + rows[i].month;
    byMonth[key] = (byMonth[key] || 0) + 1;
  }
  const monthKeys = Object.keys(byMonth);
  for (let i = 0; i < monthKeys.length; i++) {
    if (byMonth[monthKeys[i]] !== EXPECTED_PROVINCES) {
      problems.push(`เดือน ${monthKeys[i]}: มี ${byMonth[monthKeys[i]]} จังหวัด ไม่ใช่ ${EXPECTED_PROVINCES}`);
    }
  }

  if (problems.length > 0) {
    for (let i = 0; i < Math.min(problems.length, 10); i++) console.error('  ✗ ' + problems[i]);
    if (problems.length > 10) console.error(`  ... และอีก ${problems.length - 10} รายการ`);
    fail(`ด่านที่ 1 ไม่ผ่าน พบปัญหา ${problems.length} รายการ`);
  }
  console.log(`  ผ่าน | ${rows.length} แถว | ${monthKeys.length} เดือน | ${EXPECTED_PROVINCES} จังหวัดครบทุกเดือน`);
}

function gateTwoOrdering(rows) {
  console.log('\nด่านที่ 2  ความสมเหตุสมผล min <= average <= max');
  const broken = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!(row.min_rain <= row.average_rain && row.average_rain <= row.max_rain)) {
      broken.push(`${row.province} ${row.year}-${row.month}: `
        + `min=${row.min_rain} avg=${row.average_rain} max=${row.max_rain}`);
    }
  }
  if (broken.length > 0) {
    for (let i = 0; i < Math.min(broken.length, 10); i++) console.error('  ✗ ' + broken[i]);
    if (broken.length > 10) console.error(`  ... และอีก ${broken.length - 10} แถว`);
    fail(`ด่านที่ 2 ไม่ผ่าน พบ ${broken.length} แถวที่ค่าเฉลี่ยไม่อยู่ระหว่างค่าต่ำสุดกับค่าสูงสุด`
       + '\n  อาการนี้มักเกิดจากต้นทางสลับลำดับคอลัมน์');
  }
  console.log(`  ผ่าน | ตรวจ ${rows.length} แถว`);
}

function gateThreeProvinces(rows, dbProvinces) {
  console.log('\nด่านที่ 3  ชื่อจังหวัดตรงกับที่มีในฐานข้อมูล');
  const sourceProvinces = {};
  for (let i = 0; i < rows.length; i++) sourceProvinces[rows[i].province] = true;

  const sourceList = Object.keys(sourceProvinces);
  const notInDb = sourceList.filter((p) => !dbProvinces[p]);
  const notInSource = Object.keys(dbProvinces).filter((p) => !sourceProvinces[p]);

  if (notInDb.length > 0 || notInSource.length > 0) {
    if (notInDb.length > 0) console.error('  ✗ มีในต้นทางแต่ไม่มีในฐานข้อมูล: ' + notInDb.join(', '));
    if (notInSource.length > 0) console.error('  ✗ มีในฐานข้อมูลแต่ไม่มีในต้นทาง: ' + notInSource.join(', '));
    fail('ด่านที่ 3 ไม่ผ่าน ชื่อจังหวัดไม่ตรงกัน'
       + '\n  ห้ามข้ามจังหวัดที่จับคู่ไม่ได้ ต้องแก้ชื่อให้ตรงก่อนจึงซิงก์ได้');
  }
  console.log(`  ผ่าน | ${sourceList.length} จังหวัดตรงกันทั้งหมด`);
}

// ---------- เปรียบเทียบกับฐานข้อมูลแล้วเขียนเฉพาะที่ต่าง ----------

function sameValue(a, b) {
  if (a === null || b === null) return a === b;
  return Math.abs(Number(a) - Number(b)) < 0.005;
}

async function main() {
  console.log('===== ซิงก์ข้อมูลปริมาณน้ำฝนรายเดือน =====');
  if (DRY_RUN) console.log('โหมด --dry-run : อ่านและตรวจอย่างเดียว ไม่เขียนฐานข้อมูล');

  loadEnv();
  const records = await fetchAllRecords();
  const rows = normalize(records);

  gateOneStructure(rows);
  gateTwoOrdering(rows);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2' } : undefined,
  });

  try {
    const [existingRows] = await connection.query(
      `SELECT idrainfall_monthly, province, year, month, min_rain, max_rain, average_rain
       FROM rainfall_monthly`
    );

    const dbProvinces = {};
    const existingByKey = {};
    let maxId = 0;
    for (let i = 0; i < existingRows.length; i++) {
      const row = existingRows[i];
      const province = String(row.province).trim();
      dbProvinces[province] = true;
      existingByKey[province + '|' + row.year + '|' + row.month] = row;
      if (row.idrainfall_monthly > maxId) maxId = row.idrainfall_monthly;
    }

    gateThreeProvinces(rows, dbProvinces);

    const toUpdate = [];
    const toInsert = [];
    const newMonths = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const existing = existingByKey[row.province + '|' + row.year + '|' + row.month];
      if (!existing) {
        toInsert.push(row);
        newMonths[row.year + '-' + String(row.month).padStart(2, '0')] = true;
        continue;
      }
      const changed = !sameValue(existing.min_rain, row.min_rain)
        || !sameValue(existing.max_rain, row.max_rain)
        || !sameValue(existing.average_rain, row.average_rain);
      if (changed) toUpdate.push(row);
    }

    console.log('\n===== สรุปสิ่งที่จะเปลี่ยน =====');
    console.log('  แถวในฐานข้อมูลเดิม :', existingRows.length);
    console.log('  แถวที่ต้องเพิ่มใหม่ :', toInsert.length);
    console.log('  แถวที่ค่าเปลี่ยนไป  :', toUpdate.length);
    const newMonthList = Object.keys(newMonths).sort();
    if (newMonthList.length > 0) console.log('  เดือนใหม่           :', newMonthList.join(', '));

    if (toInsert.length === 0 && toUpdate.length === 0) {
      console.log('\n✓ ข้อมูลตรงกับต้นทางอยู่แล้ว ไม่ต้องเปลี่ยนอะไร');
      return;
    }

    if (DRY_RUN) {
      console.log('\n✓ ตรวจผ่านทุกด่าน (โหมด --dry-run จึงไม่เขียนฐานข้อมูล)');
      return;
    }

    await connection.beginTransaction();
    try {
      for (let i = 0; i < toUpdate.length; i++) {
        const row = toUpdate[i];
        const [result] = await connection.query(
          `UPDATE rainfall_monthly SET min_rain=?, max_rain=?, average_rain=?, date=?
           WHERE province=? AND year=? AND month=?`,
          [row.min_rain, row.max_rain, row.average_rain, row.date,
           row.province, row.year, row.month]
        );
        if (result.affectedRows !== 1) {
          throw new Error(`${row.province} ${row.year}-${row.month}: `
            + `แก้ไขได้ ${result.affectedRows} แถว ซึ่งไม่ใช่ 1 แถว`);
        }
      }

      let nextId = maxId;
      for (let i = 0; i < toInsert.length; i++) {
        const row = toInsert[i];
        nextId = nextId + 1;
        await connection.query(
          `INSERT INTO rainfall_monthly
             (idrainfall_monthly, year, month, province, min_rain, max_rain, average_rain, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [nextId, row.year, row.month, row.province,
           row.min_rain, row.max_rain, row.average_rain, row.date]
        );
      }

      const [check] = await connection.query(
        `SELECT COUNT(*) AS total,
                SUM(min_rain IS NULL OR max_rain IS NULL OR average_rain IS NULL) AS null_rows,
                SUM(NOT (min_rain <= average_rain AND average_rain <= max_rain)) AS broken
         FROM rainfall_monthly`
      );
      if (Number(check[0].broken) > 0 || Number(check[0].null_rows) > 0) {
        throw new Error(`ตรวจหลังเขียนไม่ผ่าน `
          + `ค่าว่าง ${check[0].null_rows} แถว ลำดับผิด ${check[0].broken} แถว`);
      }

      await connection.commit();
      console.log('\n✓ เขียนข้อมูลสำเร็จ');
      console.log('  เพิ่มใหม่ :', toInsert.length, 'แถว');
      console.log('  แก้ไข    :', toUpdate.length, 'แถว');
      console.log('  รวมทั้งตาราง :', check[0].total, 'แถว');

      if (newMonthList.length > 0) {
        console.log('\n*** มีข้อมูลเดือนใหม่เข้ามา ***');
        console.log('    ควรเทรนแบบจำลองใหม่และอัปเดตตาราง rainfall_forecast');
        console.log('    อย่าลืมแก้ DATA_END ในโน้ตบุ๊กให้เลยเดือนใหม่ก่อนรัน');
      }
    } catch (error) {
      await connection.rollback();
      fail('เขียนข้อมูลไม่สำเร็จ ย้อนกลับทั้งหมดแล้ว\n  ' + error.message);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  fail(error.message);
});
