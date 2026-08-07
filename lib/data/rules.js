import 'server-only';
import pool from "@/lib/db";

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

  const result = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    let province = row.province;
    if (province) {
      province = province.trim();
    }

    let antecedents = [];
    if (row.antecedents) {
      const parts = row.antecedents.split(',');
      for (let j = 0; j < parts.length; j++) {
        antecedents.push(parts[j].trim());
      }
    }

    let consequents = [];
    if (row.consequents) {
      const parts = row.consequents.split(',');
      for (let j = 0; j < parts.length; j++) {
        consequents.push(parts[j].trim());
      }
    }

    result.push({
      province: province,
      year: Number(row.year),
      month: Number(row.month),
      antecedents: antecedents,
      consequents: consequents,
      support: parseFloat(row.support) || 0,
      confidence: parseFloat(row.confidence) || 0,
      lift: parseFloat(row.lift) || 0,
      months_with_flood: parseInt(row.months_with_flood) || 0,
    });
  }
  return result;
}

export const getAssociationRules = fetchAssociationRules;
