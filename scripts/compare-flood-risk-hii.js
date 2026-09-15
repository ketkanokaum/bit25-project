#!/usr/bin/env node
/**
 * เทียบระดับความเสี่ยงอุทกภัยของเว็บ (คำนวณจาก flood_event 2563-2567)
 * กับข้อมูลพื้นที่เสี่ยงน้ำท่วมของ สสน. (ดาวเทียม 2548-2564 รายตำบล)
 *
 * ทั้งสองฝั่งเป็น "สัดส่วนปีที่เดือนนี้เคยเกิดน้ำท่วม" เหมือนกัน
 * ต่างกันที่ตัวหาร (5 ปี vs 17 ปี) และหน่วยพื้นที่ (จังหวัด vs ตำบล)
 *
 * Usage: node scripts/compare-flood-risk-hii.js
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { loadEnvLocal } = require("./lib/env");
loadEnvLocal();

// ปีเดียวกับ REAL_DATA_YEARS ใน lib/prediction.js
const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];
const HII_YEARS = 17;

const HII_CSV = path.join(__dirname, "output", "hii_flood_risk_by_province_month.csv");
const OUT_CSV = path.join(__dirname, "output", "flood-risk-agreement-hii.csv");

// เกณฑ์ของเว็บ (lib/prediction.js: classifyRiskLevel)
function siteLevel(rate) {
  if (rate == null) return null;
  if (rate < 1 / 3) return "เสี่ยงต่ำ";
  if (rate < 2 / 3) return "เสี่ยงปานกลาง";
  return "เสี่ยงสูง";
}

// เกณฑ์ของ สสน. : 1-3 / 4-8 / 9-17 ครั้งในรอบ 17 ปี
function hiiLevel(count17) {
  if (count17 <= 0) return "เสี่ยงต่ำ";
  if (count17 <= 3) return "เสี่ยงต่ำ";
  if (count17 <= 8) return "เสี่ยงปานกลาง";
  return "เสี่ยงสูง";
}

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

async function main() {
  // ---------- ฝั่งเว็บ: นับปีที่เกิดน้ำท่วมของแต่ละจังหวัด-เดือน ----------
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
    ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
  });

  const [rows] = await pool.query(
    `SELECT TRIM(province) AS province, year, month, COUNT(*) AS n
       FROM flood_event
      WHERE year BETWEEN ? AND ?
      GROUP BY TRIM(province), year, month`,
    [REAL_DATA_YEARS[0], REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1]]
  );
  await pool.end();

  // (จังหวัด|เดือน) -> Set ของปีที่เกิดน้ำท่วม  = ตรรกะเดียวกับ countFloodYears()
  const siteYears = new Map();
  const provinces = new Set();
  for (const r of rows) {
    provinces.add(r.province);
    const key = `${r.province}|${r.month}`;
    if (!siteYears.has(key)) siteYears.set(key, new Set());
    siteYears.get(key).add(Number(r.year));
  }

  // ---------- ฝั่ง สสน. ----------
  const hiiRows = parseCsv(fs.readFileSync(HII_CSV, "utf8"));
  const hii = new Map();
  for (const r of hiiRows) {
    hii.set(`${r.province}|${Number(r.month)}`, {
      maxCount: Number(r.max_count17),
      nTambon: Number(r.n_tambon),
      nHigh: Number(r.n_high),
      nMid: Number(r.n_mid),
      pctHighMid: Number(r.pct_high_mid),
    });
  }
  const hiiProvinces = new Set(hiiRows.map((r) => r.province));

  // ---------- เทียบ ----------
  const out = [];
  let agree = 0, total = 0, siteHigher = 0, hiiHigher = 0, noHii = 0;

  for (const province of Array.from(provinces).sort()) {
    for (let month = 1; month <= 12; month++) {
      const key = `${province}|${month}`;
      const count = siteYears.has(key) ? siteYears.get(key).size : 0;
      const rate = count / REAL_DATA_YEARS.length;
      const lvSite = siteLevel(rate);

      // จังหวัดที่ไม่มีใน สสน. เลย = ไม่มีข้อมูล (ไม่ใช่ศูนย์)
      if (!hiiProvinces.has(province)) {
        noHii++;
        out.push({ province, month, site_count: count, site_rate: rate.toFixed(2),
          site_level: lvSite, hii_max_count: "", hii_rate: "", hii_level: "ไม่มีข้อมูล",
          hii_pct_area: "", match: "" });
        continue;
      }

      const h = hii.get(key);
      const maxCount = h ? h.maxCount : 0;   // ไม่มีแถว = ไม่เคยท่วมเดือนนั้นใน 17 ปี
      const lvHii = hiiLevel(maxCount);
      const match = lvSite === lvHii;

      total++;
      if (match) agree++;
      else {
        const order = { "เสี่ยงต่ำ": 1, "เสี่ยงปานกลาง": 2, "เสี่ยงสูง": 3 };
        if (order[lvSite] > order[lvHii]) siteHigher++; else hiiHigher++;
      }

      out.push({
        province, month,
        site_count: count,
        site_rate: rate.toFixed(2),
        site_level: lvSite,
        hii_max_count: maxCount,
        hii_rate: (maxCount / HII_YEARS).toFixed(2),
        hii_level: lvHii,
        hii_pct_area: h ? h.pctHighMid : 0,
        match: match ? "ตรงกัน" : "ไม่ตรง",
      });
    }
  }

  const head = Object.keys(out[0]);
  const csv = [head.join(","), ...out.map((r) => head.map((k) => r[k]).join(","))].join("\n");
  fs.writeFileSync(OUT_CSV, "﻿" + csv, "utf8");

  console.log("=".repeat(62));
  console.log("ความสอดคล้อง: เว็บ (5 ปี, จังหวัด) vs สสน. (17 ปี, ตำบล)");
  console.log("=".repeat(62));
  console.log(`  เทียบได้ทั้งหมด      : ${total} คู่ (จังหวัด x เดือน)`);
  console.log(`  ตรงกัน               : ${agree} (${((agree / total) * 100).toFixed(1)}%)`);
  console.log(`  เว็บประเมินสูงกว่า สสน.: ${siteHigher} (${((siteHigher / total) * 100).toFixed(1)}%)`);
  console.log(`  สสน. ประเมินสูงกว่าเว็บ: ${hiiHigher} (${((hiiHigher / total) * 100).toFixed(1)}%)`);
  if (noHii) console.log(`  ไม่มีข้อมูลฝั่ง สสน.   : ${noHii} คู่ (ภูเก็ต, ระนอง)`);

  // ตารางไขว้
  const levels = ["เสี่ยงต่ำ", "เสี่ยงปานกลาง", "เสี่ยงสูง"];
  const grid = {};
  for (const a of levels) { grid[a] = {}; for (const b of levels) grid[a][b] = 0; }
  for (const r of out) {
    if (r.hii_level === "ไม่มีข้อมูล") continue;
    grid[r.site_level][r.hii_level]++;
  }
  console.log("\nตารางไขว้ (แถว = เว็บ, คอลัมน์ = สสน.)");
  console.log(`${"".padEnd(16)}${levels.map((l) => l.padStart(14)).join("")}`);
  for (const a of levels) {
    console.log(`${a.padEnd(16)}${levels.map((b) => String(grid[a][b]).padStart(14)).join("")}`);
  }

  console.log(`\nบันทึกไฟล์: ${OUT_CSV}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
