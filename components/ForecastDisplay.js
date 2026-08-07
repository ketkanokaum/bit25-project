'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

import { percentOfNormal, classifyRainLevel } from '@/lib/data/rainlevel';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function tooltipFormatter(value, name) {
  if (name === 'ปริมาณฝนจริง') {
    if (value == null) return ['-', name];
    return [`${value} มม.`, name];
  }
  if (name === 'ปริมาณฝนพยากรณ์') {
    if (value == null) return ['-', name];
    return [`${value} มม.`, name];
  }
  if (name === 'ค่าอาจคลาดเคลื่อนอยู่ในช่วงนี้') {
    if (!Array.isArray(value)) return ['-', name];
    return [`${value[0].toFixed(1)}–${value[1].toFixed(1)} มม.`, name];
  }
  return [value, name];
}

export default function ForecastDisplay({ initialProvince, forecastRows, actualRows }) {
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [searchQuery, setSearchQuery] = useState('');

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
  for (let i = 0; i < filteredProvinces.length; i++) {
    const province = filteredProvinces[i];
    provinceOptions.push(
      <option key={province} value={province}>{province}</option>
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
      </div>

      {!data ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 text-sm font-bold">
          ยังไม่มีข้อมูลพยากรณ์สำหรับจังหวัดนี้
        </div>
      ) : (
        <>
          {highlightForecast && (
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${highlightStyle.border}`}>
              <div className={`px-6 py-5 ${highlightStyle.bg}`}>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  ปริมาณน้ำฝนที่คาดการณ์ เดือน{THAI_MONTHS[highlightForecast.month - 1]} {data.year + 543}
                </p>
                <p className="text-[42px] font-black text-slate-800 leading-none">
                  {Number(highlightForecast.predicted_rain).toFixed(1)}
                  <span className="text-[18px] font-bold text-slate-400 ml-1">มม.</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ช่วงที่เป็นไปได้ {Number(highlightForecast.predicted_rain_lower).toFixed(1)}–{Number(highlightForecast.predicted_rain_upper).toFixed(1)} มม.
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
            <p className="text-xs text-slate-400 mb-4">เส้นทึบคือข้อมูลจริง เส้นประคือค่าพยากรณ์ พื้นที่แรเงาคือช่วงความเชื่อมั่น</p>

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
                  name="ปริมาณฝนพยากรณ์"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  strokeDasharray="7 4"
                  dot={{ r: 5, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
                  connectNulls={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {verifiedMonths.length > 0 && (
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
          )}
        </>
      )}
    </div>
  );
}
