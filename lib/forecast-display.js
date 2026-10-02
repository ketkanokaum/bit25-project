export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export function formatMm(value) {
  if (value == null) return null;
  return Number(value).toFixed(1);
}

export function buildSummarySentence(province, monthName, forecastRow, diffMm, rangeText, rainLevel) {
  if (!forecastRow) return null;

  let sentence = `เดือน${monthName} จังหวัด${province}`;

  if (rainLevel && rainLevel.tier != null) {
    sentence += ` ${rainLevel.label}`;
  }

  sentence += ` คาดว่าจะมีปริมาณฝนประมาณ ${formatMm(forecastRow.predicted_rain)} มม.`;

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

// ปริมาณฝนรายปีของจังหวัด+เดือนที่เลือก พร้อมระบุว่าปีนั้นเคยมีรายงานอุทกภัยหรือไม่
// ปีที่ไม่มีข้อมูลฝนจะได้ rain เป็น null ไม่แปลงเป็น 0
export function buildFloodRainfallHistory(province, month, historyRows, floodEvents, years) {
  const result = [];

  for (let i = 0; i < years.length; i++) {
    const year = years[i];

    let rain = null;
    for (let j = 0; j < historyRows.length; j++) {
      const row = historyRows[j];
      if (row.province === province && row.year === year && row.month === month) {
        rain = row.average_rain != null ? Number(row.average_rain) : null;
        break;
      }
    }

    let flooded = false;
    for (let j = 0; j < floodEvents.length; j++) {
      const event = floodEvents[j];
      if (event.province === province && event.year === year && event.month === month) {
        flooded = true;
        break;
      }
    }

    result.push({ year: year, rain: rain, flooded: flooded });
  }

  return result;
}

// เทียบค่าฝนพยากรณ์กับช่วงฝนที่เคยพบในปีที่มีรายงานอุทกภัยเดือนเดียวกัน
// ไม่สรุปว่าจะท่วมหรือไม่ท่วม บอกเพียงว่าค่าพยากรณ์อยู่ในช่วง/ต่ำกว่า/สูงกว่าช่วงที่เคยพบ
export function buildForecastVsHistoryComparison(monthName, predictedRain, historyList) {
  let floodedCount = 0;
  for (let i = 0; i < historyList.length; i++) {
    if (historyList[i].flooded) floodedCount++;
  }
  const totalYears = historyList.length;

  const floodYearsWithRain = [];
  for (let i = 0; i < historyList.length; i++) {
    if (historyList[i].flooded && historyList[i].rain != null) {
      floodYearsWithRain.push(historyList[i]);
    }
  }

  if (floodYearsWithRain.length === 0) {
    return {
      status: 'no_data',
      sentence: `ไม่มีข้อมูลปริมาณฝนของปีที่เคยมีรายงานอุทกภัยในเดือน${monthName}ให้เปรียบเทียบ`,
      floodYearCount: floodedCount,
      totalYears: totalYears,
      minRain: null,
      maxRain: null,
    };
  }

  let minRain = floodYearsWithRain[0].rain;
  let maxRain = floodYearsWithRain[0].rain;
  for (let i = 1; i < floodYearsWithRain.length; i++) {
    if (floodYearsWithRain[i].rain < minRain) minRain = floodYearsWithRain[i].rain;
    if (floodYearsWithRain[i].rain > maxRain) maxRain = floodYearsWithRain[i].rain;
  }

  const predicted = Number(predictedRain);
  const rangeSuffix =
    `(${formatMm(minRain)} – ${formatMm(maxRain)} มม. จากปีที่มีรายงานอุทกภัย ${floodedCount} จาก ${totalYears} ปีที่ศึกษา)`;

  let status;
  let sentence;

  if (predicted >= minRain && predicted <= maxRain) {
    status = 'in_range';
    sentence =
      `คาดการณ์ปริมาณน้ำฝนเดือน${monthName}อยู่ที่ ${formatMm(predicted)} มม. ` +
      `ซึ่งอยู่ในช่วงปริมาณน้ำฝนที่เคยพบในเดือนเดียวกันของปีที่มีรายงานอุทกภัย ` +
      `โดยพบรายงาน ${floodedCount} จาก ${totalYears} ปีที่ศึกษา ควรใช้ข้อมูลนี้ประกอบการติดตามสถานการณ์ฝนและน้ำในพื้นที่`;
  } else if (predicted < minRain) {
    status = 'below_range';
    sentence =
      `คาดการณ์ปริมาณน้ำฝนเดือน${monthName}อยู่ที่ ${formatMm(predicted)} มม. ` +
      `ต่ำกว่าปริมาณน้ำฝนที่พบในปีที่มีรายงานอุทกภัยในชุดข้อมูลย้อนหลัง ${rangeSuffix} ` +
      `ควรใช้ข้อมูลนี้ประกอบการติดตามสถานการณ์ฝนและน้ำในพื้นที่`;
  } else {
    // ยังไม่มีตัวอย่างถ้อยคำจากผู้ใช้สำหรับกรณีนี้ (ฉบับร่าง รอ confirm)
    status = 'above_range';
    sentence =
      `คาดการณ์ปริมาณน้ำฝนเดือน${monthName}อยู่ที่ ${formatMm(predicted)} มม. ` +
      `สูงกว่าปริมาณน้ำฝนที่เคยพบในปีที่มีรายงานอุทกภัยในชุดข้อมูลย้อนหลัง ${rangeSuffix} ` +
      `ควรใช้ข้อมูลนี้ประกอบการติดตามสถานการณ์ฝนและน้ำในพื้นที่`;
  }

  return {
    status: status,
    sentence: sentence,
    floodYearCount: floodedCount,
    totalYears: totalYears,
    minRain: minRain,
    maxRain: maxRain,
  };
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
