import 'server-only';
import pool from '@/lib/db';
import { getCached, TEN_MINUTES } from '@/lib/cache';


// แปลงข้อความ "A,B" เป็น ["A", "B"]
function splitItems(text) {
  const result = [];
  if (!text) {
    return result;
  }

  const parts = text.split(',');

  for (let i = 0; i < parts.length; i++) {
    result.push(parts[i].trim());
  }
  return result;
}


// ดึง Association Rules
async function loadAssociationRules() {

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

  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    result.push({
      province: row.province,
      year: Number(row.year),
      month: Number(row.month),

      antecedents: splitItems(row.antecedents),
      consequents: splitItems(row.consequents),

      support: parseFloat(row.support) || 0,
      confidence: parseFloat(row.confidence) || 0,
      lift: parseFloat(row.lift) || 0,
      months_with_flood: parseInt(row.months_with_flood) || 0,
    });
  }

  return result;
}

export async function getAssociationRules() {
  return getCached('association-rules', TEN_MINUTES, loadAssociationRules);
}
