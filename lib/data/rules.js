import 'server-only'
import pool from "@/lib/db";

export async function getAssociationRules() {
  const sqlQuery = `
    SELECT 
      province AS Province,
      CONCAT(year, '_', season) AS Season,
      antecedents,
      consequents,
      support,
      confidence,
      lift
    FROM association_rules
  `;
  
  const [rows] = await pool.query(sqlQuery);

  // แปลง String ให้กลับเป็น Array เพื่อให้กราฟนำไปใช้ต่อได้
  return rows.map((row) => ({
    ...row,
    antecedents: row.antecedents ? row.antecedents.split(',').map(s => s.trim()) : [],
    consequents: row.consequents ? row.consequents.split(',').map(s => s.trim()) : [],
    support:    parseFloat(row.support)    || 0,
    confidence: parseFloat(row.confidence) || 0,
    lift:       parseFloat(row.lift)       || 0,
  }));
}