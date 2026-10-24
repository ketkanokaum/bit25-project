import 'server-only';
import forecastTable from '@/lib/data/forecast-table.json';

const FORECAST_MONTHS = 3;

export function buildForecastRows(lastActualYear, lastActualMonth) {
  const periods = [];
  const index = lastActualYear * 12 + lastActualMonth;

  for (let step = 1; step <= FORECAST_MONTHS; step++) {
    const next = index + step;
    periods.push({
      year: Math.floor((next - 1) / 12),
      month: ((next - 1) % 12) + 1,
    });
  }

  const provinces = Object.keys(forecastTable.table);
  provinces.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const rows = [];

  for (let i = 0; i < provinces.length; i++) {
    const province = provinces[i];
    const monthly = forecastTable.table[province];

    for (let j = 0; j < periods.length; j++) {
      const period = periods[j];
      const cell = monthly[String(period.month)];

      if (!cell) continue;

      rows.push({
        province: province,
        year: period.year,
        month: period.month,
        predicted_rain: cell.predicted_rain,
        predicted_rain_lower: cell.predicted_rain_lower,
        predicted_rain_upper: cell.predicted_rain_upper,
        horizon_months: j + 1,
        generated_at: forecastTable.train_end,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.province !== b.province) return a.province < b.province ? -1 : 1;
    return a.year * 12 + a.month - (b.year * 12 + b.month);
  });

  return rows;
}
