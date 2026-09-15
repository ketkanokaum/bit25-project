'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

import { percentOfNormal, classifyRainLevel } from '@/lib/rainlevel';
import { provinceRegions, regionOrder } from '@/lib/constants/provinces';
import CompareRainfallDisplay from '@/components/CompareRainfallDisplay';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function tooltipFormatter(value, name) {
  if (name === 'ปริมาณน้ำฝนจริง') {
    if (value == null) return ['-', name];
    return [`${value} มม.`, name];
  }
  if (name === 'แนวโน้มปริมาณน้ำฝน') {
    if (value == null) return ['-', name];
    return [`${value} มม.`, name];
  }
  if (name === 'ค่าอาจคลาดเคลื่อนอยู่ในช่วงนี้') {
    if (!Array.isArray(value)) return ['-', name];
    return [`${value[0].toFixed(1)}–${value[1].toFixed(1)} มม.`, name];
  }
  return [value, name];
}

// Tertile cutoffs (33rd/66th percentile) computed from the live
// province_climate_normals dataset (n=924, all 77 provinces x 12 months) —
// TMD publishes no official relative-humidity or rain-day-count tiers, so
// this splits the actual distribution into three equal-sized groups rather
// than using arbitrary round numbers.
function humidityInfo(pct) {
  if (pct == null) return null;
  if (pct < 73) return { emoji: '🌤️', label: 'อากาศค่อนข้างแห้ง' };
  if (pct <= 80) return { emoji: '💧', label: 'อากาศชื้นปานกลาง' };
  return { emoji: '💧', label: 'อากาศชื้นตลอดทั้งเดือน' };
}

function rainDaysInfo(days) {
  if (days == null) return null;
  if (days < 4) return { emoji: '🌦️', label: 'ฝนตกไม่บ่อย' };
  if (days <= 15) return { emoji: '🌧️', label: 'ฝนตกเป็นช่วงๆ' };
  return { emoji: '⛈️', label: 'ฝนตกเกือบทุกวัน' };
}

// Temperature bands follow TMD's own official "เกณฑ์อากาศ" day-classification
// (tmd.go.th/info/เกณฑ์อากาศ): hot >=35.0C, cool 16.0-22.9C. Applied here to
// monthly-average min/max rather than a single day's reading.
function tempEmoji(min, max) {
  if (max == null) return '🌡️';
  if (max >= 35) return '🥵';
  if (max >= 32) return '☀️';
  if (min != null && min < 23) return '🧥';
  return '🌤️';
}

export default function ForecastDisplay({ initialProvince, forecastRows, actualRows }) {
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  const provinces = useMemo(() => {
    const uniqueProvinces = [];
    for (let i = 0; i < forecastRows.length; i++) {
      const province = forecastRows[i].province;
      if (uniqueProvinces.includes(province) === false) {
        uniqueProvinces.push(province);
      }
    }
    uniqueProvinces.sort();
    return uniqueProvinces;
  }, [forecastRows]);

  const filteredProvinces = useMemo(() => {
    const query = searchQuery.trim();
    if (query === '') return provinces;

    const result = [];
    for (let i = 0; i < provinces.length; i++) {
      if (provinces[i].includes(query)) {
        result.push(provinces[i]);
      }
    }
    return result;
  }, [provinces, searchQuery]);

  const groupedProvinces = useMemo(() => {
    const groups = {};
    for (let i = 0; i < filteredProvinces.length; i++) {
      const province = filteredProvinces[i];
      const region = provinceRegions[province] || 'อื่นๆ';
      if (!groups[region]) groups[region] = [];
      groups[region].push(province);
    }
    return groups;
  }, [filteredProvinces]);

  useEffect(() => {
    if (filteredProvinces.length === 0) return;
    if (!filteredProvinces.includes(selectedProvince)) {
      setSelectedProvince(filteredProvinces[0]);
    }
  }, [filteredProvinces, selectedProvince]);

  const data = useMemo(() => {
    const myForecast = [];
    for (let i = 0; i < forecastRows.length; i++) {
      if (forecastRows[i].province === selectedProvince) {
        myForecast.push(forecastRows[i]);
      }
    }
    if (myForecast.length === 0) return null;

    const year = myForecast[0].year;

    const myActual = [];
    for (let i = 0; i < actualRows.length; i++) {
      const row = actualRows[i];
      if (row.province === selectedProvince && row.year === year) {
        myActual.push(row);
      }
    }

    return { province: selectedProvince, year, actual: myActual, forecast: myForecast };
  }, [forecastRows, actualRows, selectedProvince]);

  const highlightForecast = useMemo(() => {
    if (!data || !data.forecast || data.forecast.length === 0) return null;

    let latest = data.forecast[0];
    let latestKey = latest.year * 12 + latest.month;
    for (let i = 1; i < data.forecast.length; i++) {
      const current = data.forecast[i];
      const currentKey = current.year * 12 + current.month;
      if (currentKey > latestKey) {
        latest = current;
        latestKey = currentKey;
      }
    }
    return latest;
  }, [data]);

  let highlightPercent = null;
  if (highlightForecast) {
    highlightPercent = percentOfNormal(highlightForecast.predicted_rain, highlightForecast.baseline_mean);
  }
  const highlightTier = classifyRainLevel(highlightPercent);
  const highlightStyle = highlightTier.tw;

  // highlightForecast is already picked as the latest month with a
  // forecast result, so the label just names that month directly — not
  // compared against the machine's real-world date, which would go blank
  // as soon as the forecast data falls behind the actual calendar.
  const highlightRelativeLabel = highlightForecast
    ? `เดือน${THAI_MONTHS[highlightForecast.month - 1]}`
    : null;

  let highlightDiffMm = null;
  if (highlightForecast && highlightForecast.baseline_mean != null) {
    highlightDiffMm = Number(highlightForecast.predicted_rain) - Number(highlightForecast.baseline_mean);
  }

  let highlightSummarySentence = null;
  if (highlightForecast) {
    const parts = [];
    const days = highlightForecast.normal_rain_days;
    if (days != null) {
      const daysRounded = Math.round(days);
      if (days > 15) parts.push(`ฝนตกบ่อย เฉลี่ย ${daysRounded} วัน/เดือน`);
      else if (days >= 4) parts.push(`ฝนตกเป็นช่วงๆ เฉลี่ย ${daysRounded} วัน/เดือน`);
      else parts.push(`ฝนตกไม่บ่อย เฉลี่ย ${daysRounded} วัน/เดือน`);
    }
    const humidity = highlightForecast.humidity_mean;
    if (humidity != null) {
      const humidityRounded = Math.round(humidity);
      if (humidity > 80) parts.push(`ชื้นตลอดทั้งเดือน เฉลี่ย ${humidityRounded}%`);
      else if (humidity < 73) parts.push(`อากาศค่อนข้างแห้ง เฉลี่ย ${humidityRounded}%`);
    }

    if (parts.length > 0 && highlightForecast.month != null) {
      const monthName = THAI_MONTHS[highlightForecast.month - 1];
      if (parts.length === 1) {
        highlightSummarySentence = `โดยทั่วไปเดือน${monthName}มักมีแนวโน้ม${parts[0]}`;
      } else {
        highlightSummarySentence = `โดยทั่วไปเดือน${monthName}มักมีแนวโน้ม${parts.slice(0, -1).join(' ')} และ${parts[parts.length - 1]}`;
      }
    }
  }

  const chartData = useMemo(() => {
    if (!data) return [];

    const actualByMonth = {};
    for (let i = 0; i < data.actual.length; i++) {
      actualByMonth[data.actual[i].month] = data.actual[i];
    }

    const forecastByMonth = {};
    for (let i = 0; i < data.forecast.length; i++) {
      forecastByMonth[data.forecast[i].month] = data.forecast[i];
    }

    let lastForecastMonth = data.forecast[0].month;
    for (let i = 1; i < data.forecast.length; i++) {
      if (data.forecast[i].month > lastForecastMonth) {
        lastForecastMonth = data.forecast[i].month;
      }
    }

    let firstForecastMonth = data.forecast[0].month;
    for (let i = 1; i < data.forecast.length; i++) {
      if (data.forecast[i].month < firstForecastMonth) {
        firstForecastMonth = data.forecast[i].month;
      }
    }

    let lastActualMonth = 0;
    for (let i = 0; i < data.actual.length; i++) {
      if (data.actual[i].month > lastActualMonth) {
        lastActualMonth = data.actual[i].month;
      }
    }

    const months = [];
    for (let month = 1; month <= lastForecastMonth; month++) {
      months.push(month);
    }

    const result = [];
    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const actualRow = actualByMonth[month];
      const forecastRow = forecastByMonth[month];

      let isBridge = false;
      if (month === lastActualMonth && lastActualMonth < lastForecastMonth) {
        isBridge = true;
      }
      const isBridgeSegment = isBridge || month === firstForecastMonth;

      let actualValue = null;
      if (actualRow) {
        actualValue = Number(actualRow.average_rain);
      }

      let forecastValue = null;
      if (forecastRow) {
        forecastValue = Number(forecastRow.predicted_rain);
      }

      let connectorValue = null;
      if (isBridgeSegment) {
        if (forecastRow) {
          connectorValue = Number(forecastRow.predicted_rain);
        } else if (actualRow) {
          connectorValue = Number(actualRow.average_rain);
        }
      }

      let forecastRange = null;
      if (forecastRow) {
        forecastRange = [Number(forecastRow.predicted_rain_lower), Number(forecastRow.predicted_rain_upper)];
      }

      let horizon = null;
      if (forecastRow) {
        horizon = forecastRow.horizon_months;
      }

      result.push({
        month,
        label: THAI_MONTHS_SHORT[month - 1],
        actual: actualValue,
        forecast: forecastValue,
        connector: connectorValue,
        forecastRange,
        horizon,
      });
    }

    return result;
  }, [data]);

  const verifiedMonths = useMemo(() => {
    if (!data) return [];

    const actualByMonth = {};
    for (let i = 0; i < data.actual.length; i++) {
      actualByMonth[data.actual[i].month] = data.actual[i];
    }

    const result = [];
    for (let i = 0; i < data.forecast.length; i++) {
      const forecastRow = data.forecast[i];
      const actualRow = actualByMonth[forecastRow.month];
      if (!actualRow) continue;

      const actualPct = percentOfNormal(Number(actualRow.average_rain), actualRow.baseline_mean);
      const forecastPct = percentOfNormal(Number(forecastRow.predicted_rain), forecastRow.baseline_mean);
      const actualTier = classifyRainLevel(actualPct);
      const forecastTier = classifyRainLevel(forecastPct);

      result.push({
        month: forecastRow.month,
        label: THAI_MONTHS_SHORT[forecastRow.month - 1],
        actualLabel: actualTier.label,
        forecastLabel: forecastTier.label,
        actualPercent: actualPct,
        forecastPercent: forecastPct,
        matched: actualTier.tier === forecastTier.tier,
      });
    }
    return result;
  }, [data]);

  const provinceOptions = [];
  for (let i = 0; i < regionOrder.length; i++) {
    const region = regionOrder[i];
    const provincesInRegion = groupedProvinces[region];
    if (!provincesInRegion || provincesInRegion.length === 0) continue;

    const options = [];
    for (let j = 0; j < provincesInRegion.length; j++) {
      const province = provincesInRegion[j];
      options.push(<option key={province} value={province}>{province}</option>);
    }
    provinceOptions.push(
      <optgroup key={region} label={region}>
        {options}
      </optgroup>
    );
  }

  const verifiedRows = [];
  for (let i = 0; i < verifiedMonths.length; i++) {
    const v = verifiedMonths[i];

    let badgeClass = 'text-[11px] font-bold px-2.5 py-1 rounded-full ';
    let badgeLabel;
    if (v.matched) {
      badgeClass += 'bg-emerald-100 text-emerald-700';
      badgeLabel = 'ระดับตรงกัน';
    } else {
      badgeClass += 'bg-red-100 text-red-700';
      badgeLabel = 'ระดับไม่ตรงกัน';
    }

    let forecastPercentText = '';
    if (v.forecastPercent != null) {
      forecastPercentText = ` (${v.forecastPercent.toFixed(0)}%)`;
    }

    let actualPercentText = '';
    if (v.actualPercent != null) {
      actualPercentText = ` (${v.actualPercent.toFixed(0)}%)`;
    }

    verifiedRows.push(
      <div key={v.month} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl">
        <span className="text-xs font-bold text-slate-600 w-16">{v.label}</span>
        <span className="text-xs text-slate-500 flex-1">
          แนวโน้มปริมาณน้ำฝน: {v.forecastLabel}
          {forecastPercentText}
          {" · "}จริง: {v.actualLabel}
          {actualPercentText}
        </span>
        <span className={badgeClass}>
          {badgeLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-sky-700">
          <div className="p-2 rounded-lg bg-white/15 flex items-center justify-center shadow-sm flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-sm">เลือกจังหวัดที่ต้องการ</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">ค้นหาจังหวัด</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
              <span className="text-slate-400 mr-2 flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal cursor-text w-full"
                placeholder="พิมพ์ชื่อจังหวัด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery !== '' && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 ml-2 flex-shrink-0 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">จังหวัด</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
              <select
                value={selectedProvince}
                onChange={(e) => { setSelectedProvince(e.target.value); setSearchQuery(''); }}
                className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer w-full"
              >
                {provinceOptions}
              </select>
              <svg className="w-4 h-4 text-slate-400 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => setShowCompare(!showCompare)}
            className="flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-800"
          >
            <svg className={`w-4 h-4 transition-transform ${showCompare ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
            เปรียบเทียบกับจังหวัดอื่น
          </button>

          {showCompare && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <CompareRainfallDisplay
                selectedProvince={selectedProvince}
                forecastRows={forecastRows}
                actualRows={actualRows}
              />
            </div>
          )}
        </div>
      </div>

      {!data ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 text-sm font-bold">
          ยังไม่มีข้อมูลแนวโน้มปริมาณน้ำฝนสำหรับจังหวัดนี้
        </div>
      ) : (
        <>
          {highlightForecast && (
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${highlightStyle.border}`}>
              <div className={`px-6 py-5 ${highlightStyle.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">
                    {/* 🌧️ ปริมาณน้ำฝนคาดการณ์{highlightRelativeLabel ? ` ${highlightRelativeLabel}` : ''} */}
                    🌧️ ปริมาณน้ำฝนคาดการณ์ เดือนตุลาคม
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800 leading-tight">
                  {THAI_MONTHS[highlightForecast.month - 1]} {data.year + 543}
                </p>
                <p className="text-[42px] font-black text-slate-800 leading-none mt-1">
                  {Number(highlightForecast.predicted_rain).toFixed(1)}
                  <span className="text-[18px] font-bold text-slate-400 ml-1">มม.</span>
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${highlightStyle.badge}`}>
                    {highlightTier.label}
                  </span>
                  {highlightDiffMm != null && (
                    <span className={`text-xs font-bold ${highlightStyle.text}`}>
                      {highlightDiffMm >= 0 ? '↑' : '↓'} {Math.abs(highlightDiffMm).toFixed(1)} มม. จากค่าเฉลี่ย
                    </span>
                  )}
                </div>

                {highlightSummarySentence && (
                  <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-black/10">
                    {highlightSummarySentence}
                  </p>
                )}
              </div>

            </div>
          )}

          {highlightForecast && (highlightForecast.humidity_mean != null || highlightForecast.normal_rain_days != null || highlightForecast.temp_max != null) && (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-slate-800 font-bold text-sm"> สภาพอากาศปกติของ{data.province}ในเดือน{THAI_MONTHS[highlightForecast.month - 1]}</h3>

              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
                {highlightForecast.temp_max != null && (
                  <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-amber-50 border border-amber-100">
                    <span className="text-4xl leading-none">{tempEmoji(highlightForecast.temp_min, highlightForecast.temp_max)}</span>
                    <span className="text-sm font-bold text-slate-700">
                      อุณหภูมิอยู่ในช่วง{' '}
                      {highlightForecast.temp_min != null ? `${Math.round(highlightForecast.temp_min)}–` : ''}
                      {Math.round(highlightForecast.temp_max)}°C
                    </span>
                  </div>
                )}
                {highlightForecast.humidity_mean != null && (() => {
                  const info = humidityInfo(highlightForecast.humidity_mean);
                  return (
                    <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-sky-50 border border-sky-100">
                      <span className="text-4xl leading-none">{info.emoji}</span>
                      <span className="text-sm font-bold text-slate-700">{info.label}</span>
                      <span className="text-xs text-slate-400">ความชื้นเฉลี่ย {Math.round(highlightForecast.humidity_mean)}%</span>
                    </div>
                  );
                })()}
                {highlightForecast.normal_rain_days != null && (() => {
                  const info = rainDaysInfo(highlightForecast.normal_rain_days);
                  return (
                    <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                      <span className="text-4xl leading-none">{info.emoji}</span>
                      <span className="text-sm font-bold text-slate-700">{info.label}</span>
                      <span className="text-xs text-slate-400">{Math.round(highlightForecast.normal_rain_days)} วัน/เดือน</span>
                    </div>
                  );
                })()}
              </div>
              <p className="text-[11px] text-slate-400 px-6 pb-4">
                ค่าเฉลี่ย 30 ปี (พ.ศ. 2524–2553) จาก{' '}
                <a href="https://data.tmd.go.th/api/index1.php" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                  กรมอุตุนิยมวิทยา (TMD)
                </a>
              </p>
            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-bold text-sm mb-1">
              ปริมาณน้ำฝนรายเดือน {data.province} — ปี {data.year + 543}
            </h3>
            

            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'มม.', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={tooltipFormatter} />
                <Legend wrapperStyle={{ fontSize: 12 }} />

                <Area
                  dataKey="forecastRange"
                  name="ค่าอาจคลาดเคลื่อนอยู่ในช่วงนี้"
                  stroke="none"
                  fill="#c4b5fd"
                  fillOpacity={0.12}
                  connectNulls={true}
                />

                <Line
                  type="monotone"
                  dataKey="actual"
                  name="ปริมาณฝนจริง"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f97316' }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="connector"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  strokeDasharray="7 4"
                  dot={false}
                  connectNulls={true}
                  legendType="none"
                  tooltipType="none"
                />

                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="แนวโน้มปริมาณน้ำฝน"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  strokeDasharray="7 4"
                  dot={{ r: 5, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
                  connectNulls={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* {verifiedMonths.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-slate-800 font-bold text-sm">ตรวจสอบความแม่นยำของค่าพยากรณ์</h3>
                <p className="text-xs text-slate-400 mt-1">
                  เทียบ "ระดับ" ตามดัชนีร้อยละของค่าปกติ ระหว่างสิ่งที่เคยพยากรณ์ไว้กับข้อมูลจริงที่เกิดขึ้นภายหลัง
                  — ตรงกันแปลว่าอยู่ในช่วงเดียวกัน ไม่ได้แปลว่าตัวเลขตรงเป๊ะ
                </p>
              </div>
              <div className="p-5 space-y-2">
                {verifiedRows}
              </div>
            </div>
          )} */}
      
        </>
      )}
    </div>
  );
}
