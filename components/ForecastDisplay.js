// components/ForecastDisplay.js
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

export default function ForecastDisplay({ initialProvince, forecastRows, actualRows }) {
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [searchQuery, setSearchQuery] = useState('');

  // รายชื่อจังหวัดที่มีข้อมูลพยากรณ์ ได้จากข้อมูลที่โหลดมาแล้ว ไม่ query ซ้ำ
  const provinces = useMemo(() => {
    return [...new Set(forecastRows.map((r) => r.province))].sort();
  }, [forecastRows]);

  // กรองรายชื่อจังหวัดในกล่องเลือกตามคำที่พิมพ์ในช่องค้นหา
  const filteredProvinces = useMemo(() => {
    const q = searchQuery.trim();
    if (q === '') return provinces;
    return provinces.filter((p) => p.includes(q));
  }, [provinces, searchQuery]);

  // ถ้าพิมพ์แล้วจังหวัดที่เลือกอยู่ไม่อยู่ในผลค้นหา ให้เลือกตัวแรกที่เจอแทน
  useEffect(() => {
    if (filteredProvinces.length === 0) return;
    if (!filteredProvinces.includes(selectedProvince)) {
      setSelectedProvince(filteredProvinces[0]);
    }
  }, [filteredProvinces, selectedProvince]);

  // กรองข้อมูลของจังหวัดที่เลือกจากก้อนที่โหลดมาทั้งหมด (เหมือน FloodSearchPatterns)
  const data = useMemo(() => {
    const myForecast = forecastRows.filter((r) => r.province === selectedProvince);
    if (myForecast.length === 0) return null;
    const year = myForecast[0].year;
    const myActual = actualRows.filter((r) => r.province === selectedProvince && r.year === year);
    return { province: selectedProvince, year, actual: myActual, forecast: myForecast };
  }, [forecastRows, actualRows, selectedProvince]);

const highlightForecast = useMemo(() => {
  if (!data?.forecast?.length) return null;
  // เลือกเดือนที่ไกลที่สุดในปฏิทิน (ไม่ใช่เวลาที่คำนวณ) เพราะถ้าพยากรณ์
  // หลายเดือนมาจากการรันครั้งเดียวกัน generated_at จะเท่ากันหมด เรียงตาม
  // เวลาจะได้ผลเสมอกันแล้วตกไปที่เดือนแรกในลำดับฐานข้อมูลแทน
  return [...data.forecast].sort(
    (a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month)
  )[0];
}, [data]);

  const highlightPercent = highlightForecast
    ? percentOfNormal(highlightForecast.predicted_rain, highlightForecast.baseline_mean)
    : null;
  const highlightTier = classifyRainLevel(highlightPercent);
  const highlightStyle = highlightTier.tw;

  // รวมข้อมูลจริง + พยากรณ์ เป็นกราฟเดียว แสดงแค่ถึงเดือนพยากรณ์ล่าสุด ไม่ยืดไป ธ.ค.
  const chartData = useMemo(() => {
    if (!data) return [];
    const actualByMonth = new Map(data.actual.map((r) => [r.month, r]));
    const forecastByMonth = new Map(data.forecast.map((r) => [r.month, r]));

    const lastForecastMonth = Math.max(...data.forecast.map((r) => r.month));
    const lastActualMonth = data.actual.length > 0
      ? Math.max(...data.actual.map((r) => r.month))
      : 0;

    const months = Array.from({ length: lastForecastMonth }, (_, i) => i + 1);

    return months.map((month) => {
      const a = actualByMonth.get(month);
      const f = forecastByMonth.get(month);
      // ต่อสะพาน: เส้นเชื่อมภาพระหว่างจุดสุดท้ายของข้อมูลจริงกับจุดแรกของพยากรณ์
      // แยก field ต่างหากจาก 'forecast' เด็ดขาด เพื่อไม่ให้ Tooltip อ่านค่านี้
      // เป็นค่าพยากรณ์จริงตอนชี้ที่เดือนสะพาน (เคยทำให้เข้าใจผิดว่าเดือนนั้นถูกพยากรณ์ด้วย)
      const isBridge = month === lastActualMonth && lastActualMonth < lastForecastMonth;
      const firstForecastMonth = Math.min(...data.forecast.map((r) => r.month));
      const isBridgeSegment = isBridge || month === firstForecastMonth;

      return {
        month,
        label: THAI_MONTHS_SHORT[month - 1],
        actual: a ? Number(a.average_rain) : null,
        forecast: f ? Number(f.predicted_rain) : null,
        connector: isBridgeSegment
          ? (f ? Number(f.predicted_rain) : (a ? Number(a.average_rain) : null))
          : null,
        // ช่วงความเชื่อมั่น: เริ่มจากเดือนที่มีพยากรณ์จริงเท่านั้น ไม่ยืดไปถึงจุดสะพาน
        forecastRange: f ? [Number(f.predicted_rain_lower), Number(f.predicted_rain_upper)] : null,
        horizon: f ? f.horizon_months : null,
      };
    });
  }, [data]);

  // เดือนที่มีทั้งข้อมูลจริงและค่าพยากรณ์พร้อมกัน (พยากรณ์ไว้ล่วงหน้า แล้วภายหลังมีข้อมูลจริงมายืนยัน)
  // ใช้ตรวจว่าพยากรณ์ "ตรงระดับ" กับความจริงหรือไม่ ตามดัชนีร้อยละของค่าปกติ
  const verifiedMonths = useMemo(() => {
    if (!data) return [];
    const actualByMonth = new Map(data.actual.map((r) => [r.month, r]));
    return data.forecast
      .filter((f) => actualByMonth.has(f.month))
      .map((f) => {
        const a = actualByMonth.get(f.month);
        const actualPct = percentOfNormal(Number(a.average_rain), a.baseline_mean);
        const forecastPct = percentOfNormal(Number(f.predicted_rain), f.baseline_mean);
        const actualTier = classifyRainLevel(actualPct);
        const forecastTier = classifyRainLevel(forecastPct);
        return {
          month: f.month,
          label: THAI_MONTHS_SHORT[f.month - 1],
          actualLabel: actualTier.label,
          forecastLabel: forecastTier.label,
          actualPercent: actualPct,
          forecastPercent: forecastPct,
          matched: actualTier.tier === forecastTier.tier,
        };
      });
  }, [data]);

  return (
    <div className="flex flex-col gap-6">

      {/* เลือกจังหวัด */}
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
                {filteredProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
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
          {/* การ์ดผลพยากรณ์หลัก */}
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

          {/* กราฟฝนจริงเทียบพยากรณ์ทั้งปี */}
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
              <Tooltip
                formatter={(value, name) => {
                    if (name === 'ปริมาณฝนจริง') return value == null ? ['-', name] : [`${value} มม.`, name];
                    if (name === 'ปริมาณฝนพยากรณ์') return value == null ? ['-', name] : [`${value} มม.`, name];
                    if (name === 'ค่าอาจคลาดเคลื่อนอยู่ในช่วงนี้') {
                    if (!Array.isArray(value)) return ['-', name];
                    return [`${value[0].toFixed(1)}–${value[1].toFixed(1)} มม.`, name];
                    }
                    return [value, name];
                }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />

                
                <Area
                  dataKey="forecastRange"
                  name="ค่าอาจคลาดเคลื่อนอยู่ในช่วงนี้"
                  stroke="none"
                  fill="#8b5cf6"
                  fillOpacity={0.12}
                  connectNulls={true}
                />

                {/* เส้นทึบ: ข้อมูลจริง */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="ปริมาณฝนจริง"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f97316' }}
                  connectNulls={false}
                />

                {/* เส้นเชื่อมภาพ: ต่อจากจุดสุดท้ายของข้อมูลจริงไปจุดแรกของพยากรณ์จริง */}
                {/* ไม่โผล่ใน Tooltip และ Legend เพราะไม่ใช่ข้อมูล เป็นแค่เส้นสายตา */}
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

                {/* เส้นประ: ค่าพยากรณ์จริงเท่านั้น (ไม่มีค่าที่เดือนสะพานแล้ว) */}
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

          {/* ตรวจสอบความแม่นยำ: เดือนที่มีทั้งข้อมูลจริงและค่าพยากรณ์ */}
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
                {verifiedMonths.map((v) => (
                  <div key={v.month} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-600 w-16">{v.label}</span>
                    <span className="text-xs text-slate-500 flex-1">
                      พยากรณ์: {v.forecastLabel}
                      {v.forecastPercent != null && ` (${v.forecastPercent.toFixed(0)}%)`}
                      {" · "}จริง: {v.actualLabel}
                      {v.actualPercent != null && ` (${v.actualPercent.toFixed(0)}%)`}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      v.matched ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {v.matched ? 'ระดับตรงกัน' : 'ระดับไม่ตรงกัน'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}