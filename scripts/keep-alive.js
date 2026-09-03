#!/usr/bin/env node
/**
 * Pings TiDB Cloud with a trivial query so the Serverless cluster never
 * sits idle long enough to auto-pause. Meant to run on a schedule (see
 * .github/workflows/keep-tidb-alive.yml) — not part of the app itself.
 */
const mysql = require("mysql2/promise");
const { loadEnvLocal } = require("./lib/env");
loadEnvLocal();

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
    connectTimeout: 20000,
  });
  const [rows] = await pool.query("SELECT 1 AS ok");
  console.log("Keep-alive ping OK:", rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error("Keep-alive ping failed:", err.message);
  process.exit(1);
});
