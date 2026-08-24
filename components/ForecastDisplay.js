'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

import { percentOfNormal, classifyRainLevel } from '@/lib/rainlevel';
import { provinceRegions, regionOrder } from '@/lib/constants/provinces';

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

function compareTooltipFormatter(value, name) {
  if (value == null) return ['-', name];
  return [`${value} มม.`, name];
}

export default function ForecastDisplay({ initialProvince, forecastRows, actualRows }) {
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareProvinces, setCompareProvinces] = useState([]);

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

  const groupedAllProvinces = useMemo(() => {
    const groups = {};
    for (let i = 0; i < provinces.length; i++) {
      const province = provinces[i];
      const region = provinceRegions[province] || 'อื่นๆ';
      if (!groups[region]) groups[region] = [];
      groups[region].push(province);
    }
    return groups;
  }, [provinces]);

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

  let highlightRelativeLabel = null;
  if (highlightForecast) {
    const today = new Date();
    const currentKey = today.getFullYear() * 12 + (today.getMonth() + 1);
    const forecastKey = highlightForecast.year * 12 + highlightForecast.month;
    const monthsAhead = forecastKey - currentKey;

    if (monthsAhead === 0) {
      highlightRelativeLabel = 'เดือนนี้';
    } else if (monthsAhead === 1) {
      highlightRelativeLabel = 'เดือนถัดไป';
    } else if (monthsAhead > 1) {
      highlightRelativeLabel = `อีก ${monthsAhead} เดือน`;
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

  const compareChartData = useMemo(() => {
    if (compareProvinces.length === 0) return [];

    const compareProvinceList = [];
    compareProvinceList.push(selectedProvince);
    for (let i = 0; i < compareProvinces.length; i++) {
      if (compareProvinces[i] !== selectedProvince) {
        compareProvinceList.push(compareProvinces[i]);
      }
    }

    let year = null;
    for (let i = 0; i < forecastRows.length; i++) {
      if (compareProvinceList.includes(forecastRows[i].province)) {
        year = forecastRows[i].year;
        break;
      }
    }

    let lastMonth = 0;
    for (let i = 0; i < forecastRows.length; i++) {
      const row = forecastRows[i];
      if (compareProvinceList.includes(row.province) && row.month > lastMonth) {
        lastMonth = row.month;
      }
    }

    const boundaries = {};
    for (let p = 0; p < compareProvinceList.length; p++) {
      const province = compareProvinceList[p];

      let lastActualMonth = 0;
      for (let i = 0; i < actualRows.length; i++) {
        const row = actualRows[i];
        if (row.province === province && row.year === year && row.month > lastActualMonth) {
          lastActualMonth = row.month;
        }
      }

      let firstForecastMonth = null;
      for (let i = 0; i < forecastRows.length; i++) {
        const row = forecastRows[i];
        if (row.province === province) {
          if (firstForecastMonth === null || row.month < firstForecastMonth) {
            firstForecastMonth = row.month;
          }
        }
      }

      boundaries[province] = { lastActualMonth, firstForecastMonth };
    }

    const result = [];
    for (let month = 1; month <= lastMonth; month++) {
      const point = { month, label: THAI_MONTHS_SHORT[month - 1] };
      for (let p = 0; p < compareProvinceList.length; p++) {
        const province = compareProvinceList[p];
        const bound = boundaries[province];

        let actualValue = null;
        for (let i = 0; i < actualRows.length; i++) {
          const row = actualRows[i];
          if (row.province === province && row.year === year && row.month === month) {
            actualValue = Number(row.average_rain);
            break;
          }
        }

        let forecastValue = null;
        for (let i = 0; i < forecastRows.length; i++) {
          const row = forecastRows[i];
          if (row.province === province && row.month === month) {
            forecastValue = Number(row.predicted_rain);
            break;
          }
        }

        const isBridgeSegment = month === bound.lastActualMonth || month === bound.firstForecastMonth;
        let connectorValue = null;
        if (isBridgeSegment) {
          if (forecastValue != null) {
            connectorValue = forecastValue;
          } else if (actualValue != null) {
            connectorValue = actualValue;
          }
        }

        point[province + '_actual'] = actualValue;
        point[province + '_forecast'] = forecastValue;
        point[province + '_connector'] = connectorValue;
      }
      result.push(point);
    }
    return result;
  }, [forecastRows, actualRows, selectedProvince, compareProvinces]);

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

  const MAX_COMPARE_PROVINCES = 5;

  function toggleCompareProvince(province) {
    const next = [];
    let found = false;
    for (let i = 0; i < compareProvinces.length; i++) {
      if (compareProvinces[i] === province) {
        found = true;
        continue;
      }
      next.push(compareProvinces[i]);
    }
    if (!found) {
      if (compareProvinces.length >= MAX_COMPARE_PROVINCES) return;
      next.push(province);
    }
    setCompareProvinces(next);
  }

  const compareLimitReached = compareProvinces.length >= MAX_COMPARE_PROVINCES;

  const compareCheckboxGroups = [];
  for (let i = 0; i < regionOrder.length; i++) {
    const region = regionOrder[i];
    const provincesInRegion = groupedAllProvinces[region];
    if (!provincesInRegion || provincesInRegion.length === 0) continue;

    const rows = [];
    for (let j = 0; j < provincesInRegion.length; j++) {
      const province = provincesInRegion[j];
      if (province === selectedProvince) continue;
      const isChecked = compareProvinces.includes(province);
      const isDisabled = !isChecked && compareLimitReached;
      rows.push(
        <label
          key={province}
          className={`flex items-center gap-2 text-sm py-1 pl-2 ${isDisabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 cursor-pointer hover:text-sky-700'}`}
        >
          <input
            type="checkbox"
            checked={isChecked}
            disabled={isDisabled}
            onChange={() => toggleCompareProvince(province)}
            className="w-4 h-4 rounded accent-sky-600 cursor-pointer disabled:cursor-not-allowed"
          />
          {province}
        </label>
      );
    }
    if (rows.length === 0) continue;

    compareCheckboxGroups.push(
      <div key={region}>
        <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider px-2 pt-2 pb-1">{region}</div>
        {rows}
      </div>
    );
  }

  const COMPARE_COLORS = ['#8b5cf6', '#f97316', '#0ea5e9', '#22c55e', '#eab308', '#ec4899'];

  const compareProvinceList = [];
  compareProvinceList.push(selectedProvince);
  for (let i = 0; i < compareProvinces.length; i++) {
    if (compareProvinces[i] !== selectedProvince) {
      compareProvinceList.push(compareProvinces[i]);
    }
  }

  const compareLines = [];
  for (let i = 0; i < compareProvinceList.length; i++) {
    const province = compareProvinceList[i];
    const color = COMPARE_COLORS[i % COMPARE_COLORS.length];

    compareLines.push(
      <Line
        key={province + '_actual'}
        type="monotone"
        dataKey={province + '_actual'}
        name={`${province} `}
        stroke={color}
        strokeWidth={2.5}
        dot={{ r: 4, fill: color }}
        connectNulls={true}
      />
    );

    compareLines.push(
      <Line
        key={province + '_connector'}
        type="monotone"
        dataKey={province + '_connector'}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="7 4"
        dot={false}
        connectNulls={true}
        legendType="none"
        tooltipType="none"
      />
    );

    compareLines.push(
      <Line
        key={province + '_forecast'}
        type="monotone"
        dataKey={province + '_forecast'}
        name={`${province} (แนวโน้ม)`}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="7 4"
        dot={{ r: 4, fill: '#fff', stroke: color, strokeWidth: 2 }}
        connectNulls={true}
        legendType="none"
      />
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
          พยากรณ์: {v.forecastLabel}
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

        <div className="px-5 pb-5 flex flex-col gap-2">
          <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">
            เปรียบเทียบกับจังหวัดอื่น (เลือกได้สูงสุด {MAX_COMPARE_PROVINCES} จังหวัด)
          </label>
          <details className="group bg-slate-50 border border-slate-200 rounded-xl open:bg-white open:border-sky-500 transition-all">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none">
              <span className="text-sm font-bold text-slate-700">
                {compareProvinces.length === 0 ? 'แตะเพื่อเลือกจังหวัด' : `เลือกแล้ว ${compareProvinces.length}/${MAX_COMPARE_PROVINCES} จังหวัด`}
              </span>
              <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </summary>
            <div className="border-t border-slate-200 px-2 pb-2 max-h-64 overflow-y-auto">
              {compareProvinces.length > 0 && (
                <div className="flex justify-end px-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCompareProvinces([])}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              )}
              {compareCheckboxGroups}
            </div>
          </details>
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
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                    ปริมาณน้ำฝนที่คาดการณ์ เดือน{THAI_MONTHS[highlightForecast.month - 1]} {data.year + 543}
                  </p>
                  {highlightRelativeLabel && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white uppercase tracking-wide flex-shrink-0">
                      {highlightRelativeLabel}
                    </span>
                  )}
                </div>
                <p className="text-[42px] font-black text-slate-800 leading-none">
                  {Number(highlightForecast.predicted_rain).toFixed(1)}
                  <span className="text-[18px] font-bold text-slate-400 ml-1">มม.</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ช่วงที่เป็นไปได้ {Number(highlightForecast.predicted_rain_lower).toFixed(1)} – {Number(highlightForecast.predicted_rain_upper).toFixed(1)} มม.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${highlightStyle.badge}`}>
                    {highlightTier.label}
                  </span>
                </div>
              </div>

            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-bold text-sm mb-1">
              ปริมาณน้ำฝนรายเดือน {data.province} — ปี {data.year + 543}
            </h3>
            <p className="text-xs text-slate-400 mb-4">เส้นทึบ คือข้อมูลจริง เส้นประ คือค่าแนวโน้มปริมาณน้ำฝน พื้นที่แรเงา คือช่วงความเชื่อมั่น</p>

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

          {compareProvinces.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-800 font-bold text-sm mb-1">
                เปรียบเทียบแนวโน้มปริมาณน้ำฝนระหว่างจังหวัด — ปี {data.year + 543}
              </h3>
              <p className="text-xs text-slate-400 mb-4">เส้นทึบคือ ข้อมูลจริง เส้นประคือค่าแนวโน้มปริมาณน้ำฝน </p>

              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={compareChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'มม.', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip formatter={compareTooltipFormatter} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {compareLines}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          
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
