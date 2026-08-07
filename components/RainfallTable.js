'use client';

import React, { useState, useMemo, useEffect } from 'react';
import RainfallChart from './RainfallChart';
import { percentOfNormal, classifyRainLevel, RAIN_LEVELS } from '@/lib/data/rainlevel';

function IconTune() {
  return <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" /></svg>;
}
function IconDrop() {
  return <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" /></svg>;
}
function IconChart() {
  return <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" /></svg>;
}
function IconSearch() {
  return <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>;
}
function IconPin() {
  return <svg className="w-3 h-3 text-sky-700" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>;
}
function IconCal() {
  return <svg className="w-3 h-3 text-sky-700" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" /></svg>;
}

const cardCls = "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col";
const cardHeaderCls = "flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50";
const iconWrapCls = "p-2 rounded-lg bg-sky-700 flex items-center justify-center shadow-sm flex-shrink-0";

const thaiMonths = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const provinceRegions = {
  "เชียงราย": "ภาคเหนือ", "น่าน": "ภาคเหนือ", "พะเยา": "ภาคเหนือ", "เชียงใหม่": "ภาคเหนือ", "แม่ฮ่องสอน": "ภาคเหนือ", "แพร่": "ภาคเหนือ", "ลำปาง": "ภาคเหนือ", "ลำพูน": "ภาคเหนือ", "อุตรดิตถ์": "ภาคเหนือ",
  "กรุงเทพมหานคร": "ภาคกลาง", "พิษณุโลก": "ภาคกลาง", "สุโขทัย": "ภาคกลาง", "เพชรบูรณ์": "ภาคกลาง", "พิจิตร": "ภาคกลาง", "กำแพงเพชร": "ภาคกลาง", "นครสวรรค์": "ภาคกลาง", "ลพบุรี": "ภาคกลาง", "ชัยนาท": "ภาคกลาง", "อุทัยธานี": "ภาคกลาง", "สิงห์บุรี": "ภาคกลาง", "อ่างทอง": "ภาคกลาง", "สระบุรี": "ภาคกลาง", "พระนครศรีอยุธยา": "ภาคกลาง", "สุพรรณบุรี": "ภาคกลาง", "นครนายก": "ภาคกลาง", "ปทุมธานี": "ภาคกลาง", "นนทบุรี": "ภาคกลาง", "นครปฐม": "ภาคกลาง", "สมุทรปราการ": "ภาคกลาง", "สมุทรสาคร": "ภาคกลาง", "สมุทรสงคราม": "ภาคกลาง",
  "หนองคาย": "ภาคตะวันออกเฉียงเหนือ", "นครพนม": "ภาคตะวันออกเฉียงเหนือ", "สกลนคร": "ภาคตะวันออกเฉียงเหนือ", "อุดรธานี": "ภาคตะวันออกเฉียงเหนือ", "หนองบัวลำภู": "ภาคตะวันออกเฉียงเหนือ", "เลย": "ภาคตะวันออกเฉียงเหนือ", "มุกดาหาร": "ภาคตะวันออกเฉียงเหนือ", "กาฬสินธุ์": "ภาคตะวันออกเฉียงเหนือ", "ขอนแก่น": "ภาคตะวันออกเฉียงเหนือ", "อำนาจเจริญ": "ภาคตะวันออกเฉียงเหนือ", "ยโสธร": "ภาคตะวันออกเฉียงเหนือ", "ร้อยเอ็ด": "ภาคตะวันออกเฉียงเหนือ", "มหาสารคาม": "ภาคตะวันออกเฉียงเหนือ", "ชัยภูมิ": "ภาคตะวันออกเฉียงเหนือ", "นครราชสีมา": "ภาคตะวันออกเฉียงเหนือ", "บุรีรัมย์": "ภาคตะวันออกเฉียงเหนือ", "สุรินทร์": "ภาคตะวันออกเฉียงเหนือ", "ศรีสะเกษ": "ภาคตะวันออกเฉียงเหนือ", "อุบลราชธานี": "ภาคตะวันออกเฉียงเหนือ", "บึงกาฬ": "ภาคตะวันออกเฉียงเหนือ",
  "สระแก้ว": "ภาคตะวันออก", "ปราจีนบุรี": "ภาคตะวันออก", "ฉะเชิงเทรา": "ภาคตะวันออก", "ชลบุรี": "ภาคตะวันออก", "ระยอง": "ภาคตะวันออก", "จันทบุรี": "ภาคตะวันออก", "ตราด": "ภาคตะวันออก",
  "ตาก": "ภาคตะวันตก", "กาญจนบุรี": "ภาคตะวันตก", "ราชบุรี": "ภาคตะวันตก", "เพชรบุรี": "ภาคตะวันตก", "ประจวบคีรีขันธ์": "ภาคตะวันตก",
  "ชุมพร": "ภาคใต้", "ระนอง": "ภาคใต้", "สุราษฎร์ธานี": "ภาคใต้", "นครศรีธรรมราช": "ภาคใต้", "กระบี่": "ภาคใต้", "พังงา": "ภาคใต้", "ภูเก็ต": "ภาคใต้", "พัทลุง": "ภาคใต้", "ตรัง": "ภาคใต้", "ปัตตานี": "ภาคใต้", "สงขลา": "ภาคใต้", "สตูล": "ภาคใต้", "นราธิวาส": "ภาคใต้", "ยะลา": "ภาคใต้"
};

const regionOrder = ["ภาคเหนือ", "ภาคตะวันออกเฉียงเหนือ", "ภาคกลาง", "ภาคตะวันออก", "ภาคตะวันตก", "ภาคใต้"];

const legendItems = [];
for (let i = 0; i < RAIN_LEVELS.length; i++) {
  const lvl = RAIN_LEVELS[i];
  legendItems.push({
    label: `${lvl.label} ${lvl.range}`,
    color: lvl.hex.color,
    bg: lvl.hex.bg,
    border: lvl.hex.border,
    dot: lvl.hex.dot,
  });
}

function getRainRiskStyleTailwind(amount, baseline) {
  let safeBaseline;
  if (baseline && baseline > 0) {
    safeBaseline = baseline;
  } else if (amount && amount > 0) {
    safeBaseline = amount;
  } else {
    safeBaseline = 1;
  }
  const percent = percentOfNormal(amount, safeBaseline);
  return classifyRainLevel(percent).tw;
}

function RainBar({ amount, baseline }) {
  const style = getRainRiskStyleTailwind(amount, baseline);
  return (
    <span className={`inline-flex items-center justify-center min-w-[60px] px-3 py-1.5 rounded-lg border text-xs font-bold ${style.bg} ${style.text} ${style.border}`}>
      {parseFloat(Number(amount).toFixed(1))}
    </span>
  );
}

function compareRows(a, b) {
  if (a.province !== b.province) return a.province.localeCompare(b.province);
  if (a.year !== b.year) return b.year - a.year;
  return a.month - b.month;
}

export default function RainfallTable({ data = [] }) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ขอนแก่น');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const years = useMemo(() => {
    const found = [];
    for (let i = 0; i < data.length; i++) {
      if (!found.includes(data[i].year)) found.push(data[i].year);
    }
    found.sort((a, b) => b - a);
    const result = ['All'];
    for (let i = 0; i < found.length; i++) {
      result.push(found[i]);
    }
    return result;
  }, [data]);

  const months = useMemo(() => {
    const found = [];
    for (let i = 0; i < data.length; i++) {
      if (!found.includes(data[i].month)) found.push(data[i].month);
    }
    found.sort((a, b) => a - b);
    const result = ['All'];
    for (let i = 0; i < found.length; i++) {
      result.push(found[i]);
    }
    return result;
  }, [data]);

  const groupedProvinces = useMemo(() => {
    const groups = {};
    for (let i = 0; i < data.length; i++) {
      const province = data[i].province;
      const region = provinceRegions[province];
      if (!groups[region]) groups[region] = [];
      if (!groups[region].includes(province)) groups[region].push(province);
    }
    for (const region in groups) {
      groups[region].sort();
    }
    return groups;
  }, [data]);

  const filteredData = [];
  const searchText = searchQuery.toLowerCase().trim();
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let matches = true;

    if (selectedProvince !== 'All' && item.province !== selectedProvince) {
      matches = false;
    }
    if (selectedYear !== 'All' && item.year !== parseInt(selectedYear)) {
      matches = false;
    }
    if (selectedMonth !== 'All' && item.month !== parseInt(selectedMonth)) {
      matches = false;
    }
    if (searchText !== '') {
      const regionName = provinceRegions[item.province] || '';
      const provinceMatches = item.province.toLowerCase().includes(searchText);
      const regionMatches = regionName.includes(searchText);
      if (!provinceMatches && !regionMatches) {
        matches = false;
      }
    }

    if (matches) filteredData.push(item);
  }

  filteredData.sort(compareRows);
  const sortedData = filteredData;

  const startIndex = page * rowsPerPage;
  const visibleRows = sortedData.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const provinceOptions = [<option key="all" value="All">แสดงทั้งหมด</option>];
  for (let i = 0; i < regionOrder.length; i++) {
    const region = regionOrder[i];
    const provincesInRegion = groupedProvinces[region];
    if (provincesInRegion) {
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
  }

  const yearOptions = [];
  for (let i = 0; i < years.length; i++) {
    const y = years[i];
    let label;
    if (y === 'All') {
      label = 'ทั้งหมด';
    } else {
      label = parseInt(y) + 543;
    }
    yearOptions.push(<option key={y} value={y}>{label}</option>);
  }

  const monthOptions = [];
  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    let label;
    if (m === 'All') {
      label = 'ทั้งหมด';
    } else {
      label = thaiMonths[parseInt(m) - 1];
    }
    monthOptions.push(<option key={m} value={m}>{label}</option>);
  }

  const tableRows = [];
  for (let i = 0; i < visibleRows.length; i++) {
    const item = visibleRows[i];
    tableRows.push(
      <tr key={i} className="hover:bg-sky-50/50 transition-colors duration-100 group border-b border-slate-50">
        <td className="px-5 py-3 font-semibold text-slate-700 text-sm group-hover:text-sky-600 transition-colors">{item.province}</td>
        <td className="px-5 py-3 text-slate-500 text-sm">{thaiMonths[item.month - 1]}</td>
        <td className="px-5 py-3 text-slate-500 text-sm">{item.year + 543}</td>
        <td className="px-5 py-3 text-right">
          <RainBar amount={item.average_rain} baseline={item.baseline_mean} />
        </td>
      </tr>
    );
  }

  const legendBadges = [];
  for (let i = 0; i < legendItems.length; i++) {
    const item = legendItems[i];
    legendBadges.push(
      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-transform hover:-translate-y-0.5 cursor-default"
        style={{ backgroundColor: item.bg, borderColor: item.border }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.dot }} />
        <span className="text-xs font-semibold" style={{ color: item.color }}>{item.label}</span>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        <span className="ml-3 text-slate-500 font-medium">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  let paginationCountText;
  if (sortedData.length > 0) {
    const lastItem = Math.min(startIndex + rowsPerPage, sortedData.length);
    paginationCountText = `${startIndex + 1}–${lastItem} จาก ${sortedData.length}`;
  } else {
    paginationCountText = '0 รายการ';
  }

  let trendSubtitleYear;
  if (selectedYear === 'All') {
    trendSubtitleYear = 'ทุกปี';
  } else {
    trendSubtitleYear = `ปี ${parseInt(selectedYear) + 543}`;
  }
  let trendSubtitleProvince = '';
  if (selectedProvince !== 'All') {
    trendSubtitleProvince = ` · ${selectedProvince}`;
  }

  return (
    <div className="flex flex-col w-full gap-4">

      <div className={cardCls}>
        <div className="flex items-center gap-3 px-5 py-3.5 bg-sky-700">
          <div className="p-2 rounded-lg bg-white/15 flex items-center justify-center shadow-sm flex-shrink-0"><IconTune /></div>
          <h3 className="text-white font-bold text-sm m-0">ตัวกรองข้อมูล</h3>
        </div>
        <div className="px-5 py-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">ค้นหาจังหวัด</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                <span className="text-slate-400 mr-2 flex-shrink-0">
                  <IconSearch />
                </span>
                <input
                  type="text"
                  className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal cursor-text w-full"
                  placeholder="พิมพ์ชื่อจังหวัด..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                    if (e.target.value !== '') setSelectedProvince('All');
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">จังหวัด</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                <select
                  value={selectedProvince}
                  onChange={(e) => { setSelectedProvince(e.target.value); setSearchQuery(''); setPage(0); }}
                  className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer w-full"
                >
                  {provinceOptions}
                </select>
                <div className="pointer-events-none text-slate-400 ml-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">ปี พ.ศ.</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                <select
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(e.target.value); setPage(0); }}
                  className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer w-full"
                >
                  {yearOptions}
                </select>
                <div className="pointer-events-none text-slate-400 ml-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">เดือน</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                <select
                  value={selectedMonth}
                  onChange={(e) => { setSelectedMonth(e.target.value); setPage(0); }}
                  className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer w-full"
                >
                  {monthOptions}
                </select>
                <div className="pointer-events-none text-slate-400 ml-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full items-stretch">

        <div className={`${cardCls} w-full md:w-[60%]`}>
          <div className={cardHeaderCls}>
            <div className={iconWrapCls}><IconDrop /></div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">ข้อมูลปริมาณน้ำฝน</h3>
              <p className="text-xs text-slate-400 m-0">หน่วย: มิลลิเมตร (มม.)</p>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-grow" style={{ maxHeight: '560px' }}>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-sky-50 border-b border-sky-100">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1"><IconPin /> จังหวัด</span>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1"><IconCal /> เดือน</span>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ปี พ.ศ.</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">ปริมาณน้ำฝน</th>
                </tr>
              </thead>
              <tbody>
                {tableRows}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" /></svg>
                        <span className="text-sm text-slate-400">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>แสดง:</span>
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-600 focus:outline-none focus:border-sky-400 cursor-pointer">
                <option value={10}>10</option>
                <option value={12}>12</option>
                <option value={20}>20</option>
              </select>
              <span>แถว</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {paginationCountText}
              </span>
              <div className="flex gap-1">
                <button disabled={page === 0} onClick={() => setPage(page - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-sky-600 hover:bg-sky-50 disabled:opacity-30 disabled:cursor-default transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" /></svg>
                </button>
                <button disabled={page >= totalPages - 1 || sortedData.length === 0} onClick={() => setPage(page + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-sky-600 hover:bg-sky-50 disabled:opacity-30 disabled:cursor-default transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`${cardCls} w-full md:w-[40%]`} style={{ minHeight: '500px' }}>
          <div className={cardHeaderCls}>
            <div className={iconWrapCls}><IconChart /></div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">แนวโน้มปริมาณน้ำฝน</h3>
              <p className="text-xs text-slate-400 m-0">
                {trendSubtitleYear}
                {trendSubtitleProvince}
              </p>
            </div>
          </div>
          <div className="p-4 flex-grow relative">
            <RainfallChart data={data} selectedProvince={selectedProvince} selectedYear={selectedYear} />
          </div>
        </div>

      </div>

      <div className={cardCls}>
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span className="hidden sm:block text-xs font-bold text-slate-400 uppercase tracking-wider pr-4 border-r border-slate-200">ระดับน้ำฝน</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {legendBadges}
          </div>
        </div>
      </div>

    </div>
  );
}
