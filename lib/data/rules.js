
import 'server-only';
import pool from "@/lib/db";
import { unstable_cache } from 'next/cache';

async function fetchAssociationRules() {
  const sql = `
    SELECT 
      TRIM(province) AS province,
      year,
      month,
      consequents,
      antecedents,
      months_with_flood,
      support,
      confidence,
      lift
    FROM association_rules
  `;
  const [rows] = await pool.query(sql);

  return rows.map((row) => ({
    ...row,
    province: row.province ? row.province.trim() : row.province,
    year: Number(row.year),
    month: Number(row.month),
    antecedents: row.antecedents ? row.antecedents.split(',').map((s) => s.trim()) : [],
    consequents: row.consequents ? row.consequents.split(',').map((s) => s.trim()) : [],
    support: parseFloat(row.support) || 0,
    confidence: parseFloat(row.confidence) || 0,
    lift: parseFloat(row.lift) || 0,
    months_with_flood: parseInt(row.months_with_flood) || 0,
  }));
}

export const getAssociationRules = unstable_cache(
  async () => fetchAssociationRules(),
  ['association-rules-cache'],
  { revalidate: 3600 }
);