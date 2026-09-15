'use client';

import { useState, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';

import { provinceRegions, regionOrder } from '@/lib/constants/provinces';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const MAX_COMPARE_PROVINCES = 5;
const COMPARE_COLORS = ['#8b5cf6', '#f97316', '#0ea5e9', '#22c55e', '#eab308', '#ec4899'];

function compareTooltipFormatter(value, name) {
  if (value == null) return ['-', name];
  return [`${value} มม.`, name];
}

// Embeds inline (toggled open/closed) on the main forecast page. The "main"
// province is whatever the parent page already has selected — this component
// only owns the "compare with" picker and the resulting chart.
export default function CompareRainfallDisplay({ selectedProvince, forecastRows, actualRows }) {
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

  const year = useMemo(() => {
    if (forecastRows.length === 0) return null;
    return forecastRows[0].year;
  }, [forecastRows]);

  const compareProvinceList = useMemo(() => {
    const list = [selectedProvince];
    for (let i = 0; i < compareProvinces.length; i++) {
      if (compareProvinces[i] !== selectedProvince) list.push(compareProvinces[i]);
    }
    return list;
  }, [selectedProvince, compareProvinces]);

  const compareChartData = useMemo(() => {
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
          if (forecastValue != null) connectorValue = forecastValue;
          else if (actualValue != null) connectorValue = actualValue;
        }

        point[province + '_actual'] = actualValue;
        point[province + '_forecast'] = forecastValue;
        point[province + '_connector'] = connectorValue;
      }
      result.push(point);
    }
    return result;
  }, [forecastRows, actualRows, compareProvinceList, year]);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">
          เปรียบเทียบ {selectedProvince} กับ (เลือกได้สูงสุด {MAX_COMPARE_PROVINCES} จังหวัด)
        </label>
        <details className="group bg-slate-50 border border-slate-200 rounded-xl open:bg-white open:border-sky-500 transition-all" open>
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

      {compareProvinces.length > 0 && (
        <div>
          <h3 className="text-slate-800 font-bold text-sm mb-1">
            เปรียบเทียบแนวโน้มปริมาณน้ำฝนระหว่างจังหวัด {year != null ? `— ปี ${year + 543}` : ''}
          </h3>

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
    </div>
  );
}
