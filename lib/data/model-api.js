import 'server-only';

const REQUEST_TIMEOUT = 75000;

export function getModelApiUrl() {
  const url = process.env.MODEL_API_URL;
  if (!url) return null;
  return url.replace(/\/+$/, '');
}

export async function fetchForecastFromModel(lastActualYear, lastActualMonth) {
  const baseUrl = getModelApiUrl();
  if (!baseUrl) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(baseUrl + '/forecast-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        last_actual_year: lastActualYear,
        last_actual_month: lastActualMonth,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('model-api ตอบกลับ HTTP ' + response.status);
      return null;
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.forecast) || data.forecast.length === 0) {
      console.error('model-api ส่งข้อมูลไม่ครบ');
      return null;
    }

    const rows = [];
    for (let i = 0; i < data.forecast.length; i++) {
      const row = data.forecast[i];
      rows.push({
        province: row.province,
        year: Number(row.year),
        month: Number(row.month),
        predicted_rain: Number(row.predicted_rain),
        predicted_rain_lower: Number(row.predicted_rain_lower),
        predicted_rain_upper: Number(row.predicted_rain_upper),
        horizon_months: Number(row.horizon_months),
        generated_at: data.train_end,
      });
    }

    rows.sort((a, b) => {
      if (a.province !== b.province) return a.province < b.province ? -1 : 1;
      return a.year * 12 + a.month - (b.year * 12 + b.month);
    });

    console.log('ใช้ค่าพยากรณ์จากแบบจำลอง ' + rows.length + ' แถว');
    return rows;
  } catch (error) {
    console.error('เรียก model-api ไม่สำเร็จ: ' + error.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
