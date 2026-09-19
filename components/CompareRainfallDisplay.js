'use client';

import { useMemo } from 'react';

import { provinceRegions, regionOrder } from '@/lib/constants/provinces';

const MAX_COMPARE_PROVINCES = 5;


export default function CompareRainfallDisplay({
  selectedProvince,
  forecastRows,
  compareProvinces,
  onChangeCompareProvinces,
}) {

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
    onChangeCompareProvinces(next);
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
                  onClick={() => onChangeCompareProvinces([])}
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
        <p className="text-xs text-slate-500">
          ผลการเปรียบเทียบแสดงอยู่ในกราฟแนวโน้มปริมาณน้ำฝนด้านล่าง
        </p>
      )}
    </div>
  );
}
