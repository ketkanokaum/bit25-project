import 'server-only'
import pool from "@/lib/db";

export async function getAssociationRules() {
  
  const sqlQuery = `
    SELECT 
      province AS Province,
      CONCAT(year, '_', season) AS Season,  -- รวมปีและฤดูกาลเป็น string เดียว 
      antecedents,
      consequents,
      support,
      confidence,
      lift
    FROM association_rules
  `;

  try {
    const [rows] = await pool.query(sqlQuery);

    // แปลงข้อมูลแต่ละแถวให้พร้อมใช้งาน
    return rows.map((row) => ({
      ...row, // คัดลอกทุก field ของแถวนั้น

      // แปลง string → array 
      antecedents: row.antecedents ? row.antecedents.split(',').map(s => s.trim()) : [],
      consequents: row.consequents ? row.consequents.split(',').map(s => s.trim()) : [],

      // แปลงเป็นตัวเลขทศนิยม ถ้าแปลงไม่ได้ให้ใช้ 0 แทน
      support:    parseFloat(row.support)    || 0,
      confidence: parseFloat(row.confidence) || 0,
      lift:       parseFloat(row.lift)       || 0,
    }));
  } catch (error) {
    console.error("Database Query Error:", error);
    return [];
  }
}