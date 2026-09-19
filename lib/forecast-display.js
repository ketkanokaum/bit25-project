export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export function formatMm(value) {
  if (value == null) return null;
  return Number(value).toFixed(1);
}


export function getRainMonthRank(monthlyNormals, month) {
  const target = monthlyNormals[month];
  if (target == null) return null;

  let rank = 1;
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    const value = monthlyNormals[m];
    if (value == null) continue;
    total++;
    if (value > target) rank++;
  }

  if (total < 12) return null;
  return { rank: rank, total: total };
}

// แยกเป็นสองชุด เดือนที่กำลังดูอยู่ชุดหนึ่ง เดือนอื่นอีกชุดหนึ่ง
// แต่ละเดือนจึงมีค่าในชุดเดียว ทำให้ระบายสีคนละสีได้โดยไม่ต้องใช้ Cell
export function buildNormalChartData(monthlyNormals, highlightMonth) {
  const result = [];
  for (let month = 1; month <= 12; month++) {
    const value = monthlyNormals[month];
    if (value == null) continue;

    const rounded = Math.round(value * 10) / 10;
    if (month === highlightMonth) {
      result.push({ month: month, label: THAI_MONTHS_SHORT[month - 1], normal: null, highlight: rounded });
    } else {
      result.push({ month: month, label: THAI_MONTHS_SHORT[month - 1], normal: rounded, highlight: null });
    }
  }
  return result;
}

export function buildSummarySentence(province, monthName, forecastRow, diffMm, rangeText) {
  if (!forecastRow) return null;

  let sentence = `เดือน${monthName} จังหวัด${province} คาดว่าจะมีปริมาณฝนประมาณ ${formatMm(forecastRow.predicted_rain)} มม.`;

  if (diffMm != null) {
    if (diffMm >= 0) {
      sentence += ` สูงกว่าค่าปกติของเดือนประมาณ ${formatMm(Math.abs(diffMm))} มม.`;
    } else {
      sentence += ` ต่ำกว่าค่าปกติของเดือนประมาณ ${formatMm(Math.abs(diffMm))} มม.`;
    }
  }

  if (rangeText) {
    sentence += ` ค่าแนวโน้มปริมาณน้ำฝนอยู่ในช่วงประมาณ ${rangeText}`;
  }

  return sentence;
}

export function buildCompareChartData(provinceList, forecastRows, actualRows, year) {
  let lastMonth = 0;
  for (let i = 0; i < forecastRows.length; i++) {
    const row = forecastRows[i];
    if (provinceList.includes(row.province) && row.month > lastMonth) {
      lastMonth = row.month;
    }
  }
  for (let i = 0; i < actualRows.length; i++) {
    const row = actualRows[i];
    if (provinceList.includes(row.province) && row.year === year && row.month > lastMonth) {
      lastMonth = row.month;
    }
  }
  if (lastMonth === 0) return [];

  const lastActualByProvince = {};
  for (let p = 0; p < provinceList.length; p++) {
    const province = provinceList[p];
    let last = 0;
    for (let i = 0; i < actualRows.length; i++) {
      const row = actualRows[i];
      if (row.province === province && row.year === year && row.month > last) {
        last = row.month;
      }
    }
    lastActualByProvince[province] = last;
  }

  const result = [];
  for (let month = 1; month <= lastMonth; month++) {
    const point = { month: month, label: THAI_MONTHS_SHORT[month - 1] };

    for (let p = 0; p < provinceList.length; p++) {
      const province = provinceList[p];

      let actualValue = null;
      for (let i = 0; i < actualRows.length; i++) {
        const row = actualRows[i];
        if (row.province === province && row.year === year && row.month === month) {
          actualValue = Number(row.average_rain);
          break;
        }
      }

      let predicted = null;
      for (let i = 0; i < forecastRows.length; i++) {
        const row = forecastRows[i];
        if (row.province === province && row.month === month) {
          predicted = Number(row.predicted_rain);
          break;
        }
      }

      let forecastValue = null;
      if (month === lastActualByProvince[province] && actualValue != null) {
        forecastValue = actualValue;
      } else if (predicted != null && month > lastActualByProvince[province]) {
        forecastValue = predicted;
      }

      point[province + '_actual'] = actualValue;
      point[province + '_forecast'] = forecastValue;
    }

    result.push(point);
  }
  return result;
}
