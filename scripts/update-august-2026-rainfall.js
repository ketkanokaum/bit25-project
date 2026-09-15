#!/usr/bin/env node
/**
 * อัปเดตปริมาณน้ำฝนเดือนสิงหาคม 2569 จากไฟล์ rainfall_monthly_2026_08.csv
 * (ตรวจสอบแล้วว่าตรงกับข้อมูลทางการของ สสน. ครบทั้ง 77 จังหวัด ไม่มีค่าคลาดเคลื่อน)
 *
 * แถวเดือน 8/2569 มีอยู่แล้วในตาราง (idrainfall_monthly, average_rain เป็น NULL)
 * สคริปต์นี้ UPDATE เฉพาะ 77 แถวนั้น จับคู่ด้วย province ไม่สร้างแถวใหม่ ไม่ลบแถวใด
 *
 * Usage:
 *   node scripts/update-august-2026-rainfall.js --dry-run
 *   node scripts/update-august-2026-rainfall.js
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { loadEnvLocal } = require("./lib/env");
loadEnvLocal();

const CSV_PATH = "/Users/ketkanok/Downloads/rainfall_monthly_2026_08.csv";

function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").trim().split("\n");
  const head = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cell = line.split(",");
    const row = {};
    for (let i = 0; i < head.length; i++) row[head[i].trim()] = cell[i];
    return row;
  });
}

function parseArgs() {
  return { dryRun: process.argv.slice(2).includes("--dry-run") };
}

async function main() {
  const opts = parseArgs();
  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));
  console.log(`อ่านไฟล์ได้ ${rows.length} แถว${opts.dryRun ? " [dry run, ไม่เขียนฐานข้อมูล]" : ""}`);

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
    ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
  });

  // ยืนยันอีกครั้งก่อนเขียนจริงว่าแถวเป้าหมายมีอยู่แล้วและเป็น NULL (กันเขียนทับข้อมูลที่ไม่ใช่ของเดิม)
  const [existing] = await pool.query(
    "SELECT province, average_rain FROM rainfall_monthly WHERE year = 2026 AND month = 8"
  );
  const existingMap = new Map(existing.map((r) => [r.province, r.average_rain]));
  console.log(`พบแถวเดือน 8/2569 ในฐานข้อมูลแล้ว ${existing.length} แถว`);

  let updated = 0;
  let skippedNotFound = 0;
  let skippedNotNull = 0;

  for (const row of rows) {
    const province = row.province;

    if (!existingMap.has(province)) {
      console.error(`✗ ไม่พบแถวเดิมของ ${province} ในตาราง — ข้าม`);
      skippedNotFound++;
      continue;
    }

    if (existingMap.get(province) !== null) {
      console.warn(`⚠ ${province} มีค่าอยู่แล้ว (ไม่ใช่ NULL) — ข้ามเพื่อความปลอดภัย`);
      skippedNotNull++;
      continue;
    }

    if (opts.dryRun) {
      console.log(`  [dry-run] ${province}: average_rain -> ${row.average_rain}`);
      updated++;
      continue;
    }

    await pool.query(
      `UPDATE rainfall_monthly
         SET idrainfall_monthly = ?, min_rain = ?, max_rain = ?, average_rain = ?, date = ?
       WHERE province = ? AND year = 2026 AND month = 8`,
      [
        Number(row.idrainfall_monthly),
        Number(row.min_rain),
        Number(row.max_rain),
        Number(row.average_rain),
        row.date,
        province,
      ]
    );
    console.log(`✓ ${province}: ${row.average_rain} มม.`);
    updated++;
  }

  console.log("\nสรุป");
  console.log(`  อัปเดตแล้ว        : ${updated}`);
  console.log(`  ไม่พบแถวเดิม       : ${skippedNotFound}`);
  console.log(`  ข้าม (ไม่ใช่ NULL) : ${skippedNotNull}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
