'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';

import { percentOfNormal, classifyRainLevel } from '@/lib/rainlevel';
import { provinceRegions, regionOrder } from '@/lib/constants/provinces';
import CompareRainfallDisplay from '@/components/CompareRainfallDisplay';
import {
  THAI_MONTHS_SHORT,
  formatMm,
  buildSummarySentence,
  buildCompareChartData,
} from '@/lib/forecast-display';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const COMPARE_COLORS = ['#2563eb', '#f97316', '#0ea5e9', '#22c55e', '#eab308', '#ec4899'];

function tooltipFormatter(value, name) {
  if (name === 'ค่าอาจคลาดเคลื่อนอยู่ในช่วงนี้') {
    if (!Array.isArray(value)) return ['-', name];
    return [`${value[0].toFixed(1)}–${value[1].toFixed(1)} มม.`, name];
  }
  if (value == null) return ['-', name];
  return [`${value} มม.`, name];
}

function formatThaiDate(isoDate) {
  if (!isoDate) return null;
  const parts = isoDate.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0]) + 543;
  const month = THAI_MONTHS_SHORT[parseInt(parts[1]) - 1];
  const day = parseInt(parts[2]);
  return `${day} ${month} ${year}`;
}

export default function ForecastDisplay({ initialProvince, forecastRows, actualRows, normalRows = [], todayRainfall = {} }) {
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [compareProvinces, setCompareProvinces] = useState([]);
  const [selectedStation, setSelectedStation] = useState('all');

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

  // ใช้เดือนล่าสุดที่มีผลพยากรณ์เสมอ
  const highlightForecast = useMemo(() => {
    if (!data || data.forecast.length === 0) return null;

    let latest = data.forecast[0];
    for (let i = 1; i < data.forecast.length; i++) {
      const row = data.forecast[i];
      if (row.year * 12 + row.month > latest.year * 12 + latest.month) {
        latest = row;
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

  const highlightMonthName = highlightForecast
    ? THAI_MONTHS[highlightForecast.month - 1]
    : null;

  let highlightDiffMm = null;
  if (highlightForecast && highlightForecast.baseline_mean != null) {
    highlightDiffMm = Number(highlightForecast.predicted_rain) - Number(highlightForecast.baseline_mean);
  }

  const monthlyNormals = useMemo(() => {
    const result = {};
    for (let i = 0; i < normalRows.length; i++) {
      const row = normalRows[i];
      if (row.province !== selectedProvince) continue;
      if (row.baseline_mean == null) continue;
      result[row.month] = Number(row.baseline_mean);
    }
    return result;
  }, [normalRows, selectedProvince]);

  let highlightRangeText = null;
  if (
    highlightForecast &&
    highlightForecast.predicted_rain_lower != null &&
    highlightForecast.predicted_rain_upper != null
  ) {
    highlightRangeText = `${formatMm(highlightForecast.predicted_rain_lower)} – ${formatMm(highlightForecast.predicted_rain_upper)} มม.`;
  }

  let highlightSummarySentence = null;
  if (highlightForecast) {
    highlightSummarySentence = buildSummarySentence(
      selectedProvince,
      highlightMonthName,
      highlightForecast,
      highlightDiffMm,
      highlightRangeText,
      highlightTier
    );
  }

  const provinceRainfall = todayRainfall[selectedProvince];
  let currentRain = null;
  if (provinceRainfall && provinceRainfall.stationCount > 0) {
    currentRain = provinceRainfall;
  }


  let selectedStationData = null;
  if (currentRain && selectedStation !== 'all' && currentRain.stations) {
    for (let i = 0; i < currentRain.stations.length; i++) {
      const station = currentRain.stations[i];
      if (station.id === selectedStation) {
        selectedStationData = station;
        break;
      }
    }
  }

  let displayRainfall = null;
  let displayRainfallText = '';
  if (currentRain) {
    if (selectedStationData) {
      displayRainfall = selectedStationData.rainfall;
      displayRainfallText = selectedStationData.name;
    } else {
      displayRainfall = currentRain.average;
      displayRainfallText = `ค่าเฉลี่ยจาก ${currentRain.stationCount} สถานี`;
    }
  }

  const stationOptions = [];
  if (currentRain && currentRain.stations) {
    for (let i = 0; i < currentRain.stations.length; i++) {
      const station = currentRain.stations[i];
      stationOptions.push(
        <option key={station.id} value={station.id}>
          {station.name} ({formatMm(station.rainfall)} มม.)
        </option>
      );
    }
  }

  const compareList = useMemo(() => {
    const list = [selectedProvince];
    for (let i = 0; i < compareProvinces.length; i++) {
      if (compareProvinces[i] !== selectedProvince) list.push(compareProvinces[i]);
    }
    return list;
  }, [selectedProvince, compareProvinces]);

  const isComparing = compareProvinces.length > 0;

  const compareChartData = useMemo(() => {
    if (!isComparing || !data) return [];
    return buildCompareChartData(compareList, forecastRows, actualRows, data.year);
  }, [isComparing, compareList, forecastRows, actualRows, data]);

  const chartData = useMemo(() => {
    if (!data) return [];

    const actualByMonth = {};
    const forecastByMonth = {};
    let lastActualMonth = 0;
    let lastMonth = 0;

    for (let i = 0; i < data.actual.length; i++) {
      const row = data.actual[i];
      actualByMonth[row.month] = row;
      if (row.month > lastActualMonth) {
        lastActualMonth = row.month;
      }
    }

    lastMonth = lastActualMonth;

    for (let i = 0; i < data.forecast.length; i++) {
      const row = data.forecast[i];
      forecastByMonth[row.month] = row;
      if (row.month > lastMonth) {
        lastMonth = row.month;
      }
    }

    const result = [];
    for (let month = 1; month <= lastMonth; month++) {
      const actualRow = actualByMonth[month];
      const forecastRow = forecastByMonth[month];

      let actualValue = null;
      let forecastValue = null;
      let forecastRange = null;

      if (actualRow) {
        actualValue = Number(actualRow.average_rain);
      }

      if (month === lastActualMonth && actualRow) {
        forecastValue = Number(actualRow.average_rain);
        forecastRange = [forecastValue, forecastValue];
      } else if (forecastRow && month > lastActualMonth) {
        forecastValue = Number(forecastRow.predicted_rain);
        if (forecastRow.predicted_rain_lower != null && forecastRow.predicted_rain_upper != null) {
          forecastRange = [Number(forecastRow.predicted_rain_lower), Number(forecastRow.predicted_rain_upper)];
        }
      }

      result.push({
        month,
        label: THAI_MONTHS_SHORT[month - 1],
        actual: actualValue,
        forecast: forecastValue,
        forecastRange,
      });
    }

    return result;
  }, [data]);

  const compareLines = [];
  if (isComparing) {
    for (let i = 0; i < compareList.length; i++) {
      const province = compareList[i];
      const color = COMPARE_COLORS[i % COMPARE_COLORS.length];

      compareLines.push(
        <Line
          key={province + '_actual'}
          type="monotone"
          dataKey={province + '_actual'}
          name={province}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color }}
          connectNulls={false}
          isAnimationActive={false}
        />
      );
      compareLines.push(
        <Line
          key={province + '_forecast'}
          type="monotone"
          dataKey={province + '_forecast'}
          name={province + ' (แนวโน้ม)'}
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray="7 4"
          dot={{ r: 4, fill: '#fff', stroke: color, strokeWidth: 2 }}
          connectNulls={true}
          legendType="none"
          isAnimationActive={false}
        />
      );
    }
  }

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
                onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setSearchQuery(''); 
                        setSelectedStation('all');
                        }}
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
                compareProvinces={compareProvinces}
                onChangeCompareProvinces={setCompareProvinces}
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
            <div className={`rounded-2xl border shadow-sm p-6 ${highlightStyle.border} ${highlightStyle.bg}`}>
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">

                <div>
                  <p className="text-[12px] font-bold text-slate-500 tracking-wide">
                    🌧️ แนวโน้มปริมาณน้ำฝน
                  </p>
                  <p className="text-xl font-black text-slate-700 leading-tight mt-1">
                    {highlightMonthName} {data.year + 543}
                  </p>
                  <p className="text-[44px] font-black text-slate-800 leading-none mt-1">
                    {formatMm(highlightForecast.predicted_rain)}
                    <span className="text-[18px] font-bold text-slate-400 ml-1">มม.</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${highlightStyle.badge}`}>
                      {highlightTier.label}
                    </span>
                    {highlightDiffMm != null && (
                      <span className={`text-xs font-bold ${highlightStyle.text}`}>
                        {highlightDiffMm >= 0 ? '↑' : '↓'} {formatMm(Math.abs(highlightDiffMm))} มม. จากค่าปกติ
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-6 lg:gap-5">
                  {monthlyNormals[highlightForecast.month] != null && (
                    <div>
                      <p className="text-xs text-slate-500">ค่าปกติของเดือนนี้</p>
                      <p className="text-lg font-black text-slate-800 mt-0.5">
                        {formatMm(monthlyNormals[highlightForecast.month])}
                        <span className="text-xs font-bold text-slate-400 ml-1">มม.</span>
                      </p>
                    </div>
                  )}
                  {highlightRangeText && (
                    <div>
                      <p className="text-xs text-slate-500">ช่วงแนวโน้มปริมาณน้ำฝน</p>
                      <p className="text-lg font-black text-slate-800 mt-0.5">{highlightRangeText}</p>
                    </div>
                  )}
                </div>

                {highlightSummarySentence && (
                  <div className="bg-white/70 border border-white rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-600 mb-1">สรุปภาพรวม</p>
                    <p className="text-[13px] leading-relaxed text-slate-600">
                      {highlightSummarySentence}
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-bold text-sm">
              {isComparing
                ? `เปรียบเทียบแนวโน้มปริมาณน้ำฝนระหว่างจังหวัด — ปี ${data.year + 543}`
                : `แนวโน้มปริมาณน้ำฝน ${data.province} — ปี ${data.year + 543}`}
            </h3>
            {isComparing && (
              <p className="text-xs text-slate-400 mt-0.5 mb-2">
                {`เส้นทึบคือฝนจริง เส้นประคือค่าพยากรณ์ · ${compareList.join(' · ')}`}
              </p>
            )}
            {/* <p className="text-xs text-slate-400 mt-0.5 mb-2">
              เปรียบเทียบข้อมูลฝนจริงกับค่าพยากรณ์รายเดือน พร้อมช่วงที่ค่าพยากรณ์อาจคลาดเคลื่อน
            </p> */}

            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={isComparing ? compareChartData : chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'มม.', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={tooltipFormatter} />
                <Legend wrapperStyle={{ fontSize: 12 }} />

                {isComparing && compareLines}

                {!isComparing && (
                  <Area
                    dataKey="forecastRange"
                    name="ช่วงคาดการณ์"
                    stroke="none"
                    fill="#fb923c"
                    fillOpacity={0.25}
                    connectNulls={true}
                    isAnimationActive={false}
                  />
                )}

                {!isComparing && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="ปริมาณฝนจริง"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2563eb' }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                )}

                {!isComparing && (
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="ค่าแนวโน้มปริมาณน้ำฝน"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    strokeDasharray="7 4"
                    dot={{ r: 5, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }}
                    connectNulls={true}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-bold text-sm">
              ฝนที่ตรวจวัดวันนี้ใน{data.province}
            </h3>
            {currentRain ? (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mt-0.5">
                  <p className="text-xs text-slate-400">
                    ข้อมูลวันที่ {formatThaiDate(currentRain.date)} จากสถานีตรวจวัด {currentRain.stationCount} สถานี
                  </p>
                  {/* {formatThaiDateTime(currentRain.latestTime) && (
                    <p className="text-xs text-slate-400">
                      อัปเดตล่าสุด {formatThaiDateTime(currentRain.latestTime)}
                    </p>
                  )} */}
                </div>

                {currentRain.stations && currentRain.stations.length > 0 && (
                  <div className="mt-4">
                    <label className="text-xs text-slate-500">เลือกสถานีตรวจวัด</label>
                    <select
                      value={selectedStation}
                      onChange={(e) => setSelectedStation(e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none"
                    >
                      <option value="all">ค่าเฉลี่ยทุกสถานี</option>
                      {stationOptions}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-2xl font-black text-slate-800 leading-none">
                      {formatMm(displayRainfall)}
                      <span className="text-xs font-bold text-slate-400 ml-1">มม.</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5">{displayRainfallText}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-2xl font-black text-slate-800 leading-none">
                      {formatMm(currentRain.max)}
                      <span className="text-xs font-bold text-slate-400 ml-1">มม.</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5">ค่าสูงสุดที่ตรวจวัด</p>
                    {currentRain.maxStation && (
                      <p className="text-xs font-bold text-slate-600">{currentRain.maxStation}</p>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-3">
                  ข้อมูลจาก{' '}
                  <a href="https://www.thaiwater.net/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                    คลังข้อมูลน้ำแห่งชาติ (thaiwater.net)
                  </a>
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-1">ยังไม่มีข้อมูลตรวจวัดวันนี้</p>
            )}
          </div>

          {/* {highlightForecast && normalChartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-slate-800 font-bold text-sm">
                    ปริมาณฝนตามปกติของ{data.province} ตลอดปี
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {normalHeadline}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {monthlyNormals[highlightForecast.month] != null && (
                    <div className="bg-slate-50 rounded-xl px-4 py-2.5">
                      <p className="text-[11px] text-slate-500">ค่าปกติเดือน{highlightMonthName}</p>
                      <p className="text-base font-black text-slate-800">
                        {formatMm(monthlyNormals[highlightForecast.month])}
                        <span className="text-[11px] font-bold text-slate-400 ml-1">มม.</span>
                      </p>
                    </div>
                  )}
                  {highlightForecast.normal_rain_days != null && (
                    <div className="bg-slate-50 rounded-xl px-4 py-2.5">
                      <p className="text-[11px] text-slate-500">วันฝนตกเฉลี่ย</p>
                      <p className="text-base font-black text-slate-800">
                        {Math.round(highlightForecast.normal_rain_days)}
                        <span className="text-[11px] font-bold text-slate-400 ml-1">วัน/เดือน</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={normalChartData} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip formatter={(value) => [`${value} มม.`, 'ค่าปกติ']} />
                  <Bar dataKey="normal" stackId="normal" fill="#bfdbfe" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="highlight" stackId="normal" fill="#1d4ed8" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>

              <p className="text-[11px] text-slate-400 mt-3">
                ค่าปกติปริมาณฝนรายเดือนเชิงพื้นที่ที่ใช้ในระบบ
                {highlightForecast.normal_rain_days != null && (
                  <>
                    {' · '}วันฝนตกเป็นค่าเฉลี่ย พ.ศ. 2544–2563 จาก{' '}
                    <a href="https://data.tmd.go.th/api/index1.php" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                      กรมอุตุนิยมวิทยา (TMD)
                    </a>
                  </>
                )}
              </p>
            </div>
          )} */}

        </>
      )}
    </div>
  );
}
