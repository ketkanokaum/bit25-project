'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { provinceRegions, regionOrder } from '@/lib/constants/provinces';

const RainfallMapView = dynamic(() => import('./RainfallMapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
      กำลังโหลดแผนที่...
    </div>
  ),
});

const METRIC_OPTIONS = [
  { key: 'today', label: 'วันนี้' },
  { key: 'yesterday', label: 'เมื่อวาน' },
  { key: 'monthly', label: 'สะสมเดือนนี้' },
  { key: 'yearly', label: 'สะสมปีนี้' },
];

function IconTune() {
  return <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" /></svg>;
}
function IconDrop() {
  return <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" /></svg>;
}
function IconSearch() {
  return <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>;
}
function IconPin() {
  return <svg className="w-3 h-3 text-sky-700" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>;
}

const cardCls = "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col";
const cardHeaderCls = "flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50";
const iconWrapCls = "p-2 rounded-lg bg-sky-700 flex items-center justify-center shadow-sm flex-shrink-0";

function formatMm(entry) {
  if (!entry) return null;
  return Math.round(entry.average * 10) / 10;
}

function ValueCell({ entry }) {
  const value = formatMm(entry);
  if (value == null) {
    return <span className="text-slate-300 text-sm">ไม่มีข้อมูล</span>;
  }
  let colorClass = 'text-slate-600';
  if (value >= 90) colorClass = 'text-red-600 font-black';
  else if (value >= 35) colorClass = 'text-orange-600 font-bold';
  else if (value > 0) colorClass = 'text-sky-600 font-bold';

  return (
    <span className={`text-sm ${colorClass}`}>
      {value.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">มม.</span>
    </span>
  );
}

export default function LiveRainfallTable({ data = [] }) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapMetric, setMapMetric] = useState('today');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = data;
    if (q !== '') {
      rows = data.filter((row) => {
        const region = provinceRegions[row.province] || '';
        return row.province.toLowerCase().includes(q) || region.includes(q);
      });
    }
    const sorted = rows.slice();
    sorted.sort((a, b) => {
      const av = a.today ? a.today.average : -1;
      const bv = b.today ? b.today.average : -1;
      return bv - av;
    });
    return sorted;
  }, [data, searchQuery]);

  const totalStationsToday = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i].today) sum += data[i].today.stationCount;
    }
    return sum;
  }, [data]);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        <span className="ml-3 text-slate-500 font-medium">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  const rowsJsx = [];
  for (let i = 0; i < filteredRows.length; i++) {
    const row = filteredRows[i];
    rowsJsx.push(
      <tr key={row.province} className="hover:bg-sky-50/50 transition-colors duration-100 group border-b border-slate-50">
        <td className="px-5 py-3 font-semibold text-slate-700 text-sm group-hover:text-sky-600 transition-colors">
          {row.province}
        </td>
        <td className="px-5 py-3 text-right"><ValueCell entry={row.today} /></td>
        <td className="px-5 py-3 text-right"><ValueCell entry={row.yesterday} /></td>
        <td className="px-5 py-3 text-right"><ValueCell entry={row.monthly} /></td>
        <td className="px-5 py-3 text-right"><ValueCell entry={row.yearly} /></td>
      </tr>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4">

      <div className={cardCls}>
        <div className="flex items-center gap-3 px-5 py-3.5 bg-sky-700">
          <div className="p-2 rounded-lg bg-white/15 flex items-center justify-center shadow-sm flex-shrink-0"><IconTune /></div>
          <h3 className="text-white font-bold text-sm m-0">ค้นหาจังหวัด</h3>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100 max-w-md">
            <span className="text-slate-400 mr-2 flex-shrink-0">
              <IconSearch />
            </span>
            <input
              type="text"
              className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal cursor-text w-full"
              placeholder="พิมพ์ชื่อจังหวัดหรือภาค..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className={`${cardHeaderCls} flex-wrap`}>
          <div className={iconWrapCls}><IconDrop /></div>
          <div className="flex-1 min-w-[160px]">
            <h3 className="font-bold text-slate-800 text-sm leading-tight">แผนที่ปริมาณฝนรายจังหวัด</h3>
            <p className="text-xs text-slate-400 m-0">สีเข้ม = ฝนมาก · แตะจังหวัดเพื่อดูตัวเลข</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 flex-shrink-0 flex-wrap">
            {METRIC_OPTIONS.map((opt) => {
              let btnClass = 'px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ';
              if (opt.key === mapMetric) {
                btnClass += 'bg-white text-sky-700 shadow-sm';
              } else {
                btnClass += 'text-slate-500 hover:text-sky-600';
              }
              return (
                <button key={opt.key} type="button" className={btnClass} onClick={() => setMapMetric(opt.key)}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ height: '480px' }}>
          <RainfallMapView data={data} metric={mapMetric} />
        </div>
      </div>

      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <div className={iconWrapCls}><IconDrop /></div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight">ปริมาณฝนจริงจากสถานีตรวจวัด</h3>
            <p className="text-xs text-slate-400 m-0">
              ข้อมูลจาก Thaiwater.net (สสน.) · {totalStationsToday.toLocaleString()} สถานีรายงานวันนี้ · เรียงจากฝนวันนี้มากไปน้อย
            </p>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-grow" style={{ maxHeight: '640px' }}>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-sky-50 border-b border-sky-100">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><IconPin /> จังหวัด</span>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">วันนี้</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">เมื่อวาน</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">สะสมเดือนนี้</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">สะสมปีนี้</th>
              </tr>
            </thead>
            <tbody>
              {rowsJsx}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" /></svg>
                      <span className="text-sm text-slate-400">ไม่พบจังหวัดที่ตรงกับเงื่อนไข</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardCls}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ค่าเฉลี่ยจากสถานีตรวจวัดจริงในจังหวัดนั้น (ไม่ใช่ค่าพยากรณ์)
          </span>
        </div>
      </div>

    </div>
  );
}
