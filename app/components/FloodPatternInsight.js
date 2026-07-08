'use client';
import { useState, useEffect } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';

// ── แยก season จาก "2018_Rainy" → "Rainy" ──
function parseSeason(str) {
  if (!str) return '';
  let parts = String(str).split('_');
  if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
    return parts.slice(1).join('_');
  }
  return str;
}

// ── แปลง antecedents/consequents รองรับทั้ง array และ string ──
function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
}

// ── config สีและ label ของแต่ละฤดู ──
const SEASON_CONFIG = {
  Rainy:  { label: 'ฤดูฝน (มิถุนายน - ตุลาคม)',    bgColor: 'bg-sky-50',   borderColor: 'border-sky-200',   badgeColor: 'bg-sky-100 text-sky-700'   },
  Winter: { label: 'ฤดูหนาว (พฤศจิกายน - กุมภาพันธ์)',  bgColor: 'bg-blue-50',  borderColor: 'border-blue-200',  badgeColor: 'bg-blue-100 text-blue-700' },
  Summer: { label: 'ฤดูร้อน (มีนาคม - พฤษภาคม)',  bgColor: 'bg-amber-50', borderColor: 'border-amber-200', badgeColor: 'bg-amber-100 text-amber-700' },
};

// ── แปลงชื่อ keyword ให้อ่านง่ายสำหรับประชาชน ──
const KW_LABEL = {
  'Search_น้ำท่วม': 'น้ำท่วม',
  'Search_พายุ': 'พายุ',
  'Search_ระดับน้ำ': 'ระดับน้ำ',
  'Search_ฝนตกหนัก': 'ฝนตกหนัก',
  'Search_อพยพ': 'เตรียมอพยพ',
  'Search_สถานการณ์น้ำ': 'เช็คสถานการณ์น้ำ',
  'Rain_Heavy': 'ช่วงที่ฝนตกหนักกว่าปกติ',
};

function kwLabel(s) {
  let t = s ? s.trim() : '';
  if (KW_LABEL[t]) return KW_LABEL[t];
  return t.replace('Search_', '');
}

// ── แปลง confidence เป็นภาษาชาวบ้าน ──
function confToHuman(conf) {
  if (conf >= 95) return 'เกือบทุกครั้ง';
  if (conf >= 85) return 'บ่อยมาก (ประมาณ 8-9 ใน 10 ครั้ง)';
  if (conf >= 75) return 'ค่อนข้างบ่อย (ประมาณ 7-8 ใน 10 ครั้ง)';
  if (conf >= 65) return 'มากกว่าครึ่งหนึ่งของสถานการณ์จริง';
  return 'ประมาณครึ่งหนึ่งของเหตุการณ์';
}

// ── แปลง lift เป็นภาษาชาวบ้าน ──
function liftToHuman(lift) {
  if (lift >= 4.0) return 'มีความสัมพันธ์กันแน่นแฟ้นมาก — คำเหล่านี้มักเกิดขึ้นพร้อมกันบ่อยกว่าปกติถึง ' + lift + ' เท่า';
  if (lift >= 3.0) return 'มีความสัมพันธ์กันสูง — คำเหล่านี้มักเกิดขึ้นพร้อมกันบ่อยกว่าปกติถึง ' + lift + ' เท่า';
  if (lift >= 2.0) return 'มีความสัมพันธ์กันปานกลาง — คำเหล่านี้มักเกิดขึ้นพร้อมกันบ่อยกว่าปกติ ' + lift + ' เท่า';
  return 'พบการค้นหาควบคู่กันอยู่บ้าง';
}

const SEASON_DETAIL = {
  Rainy:
    'ในช่วงฤดูฝน ประชาชนจะตื่นตัวกับสถานการณ์น้ำอย่างชัดเจน โดยพบว่าเมื่อคนค้นหาคำว่า "น้ำท่วม" มักจะกดค้นหาคำว่า "ระดับน้ำ" และ "เตรียมอพยพ" ควบคู่ไปด้วยทันที ซึ่งสะท้อนพฤติกรรมการเตรียมพร้อมรับมือภัยพิบัติจริงในพื้นที่',

  Winter:
    'สำหรับฤดูหนาว แม้ภาพรวมฝนจะน้อย แต่ในพื้นที่ที่ยังมีฝนตก (เช่น ภาคใต้) พบรูปแบบการค้นหาคำว่า "น้ำท่วม" และ "ฝนตกหนัก" เกิดขึ้นร่วมกันอย่างมีนัยสำคัญ สอดคล้องกับสถิติปริมาณน้ำฝนจริงที่ตรวจพบในช่วงนั้น',

  Summer:
    'ในช่วงฤดูร้อน แม้จะเป็นช่วงหน้าแล้ง แต่ประชาชนในบางพื้นที่ยังคงค้นหาเรื่อง "ระดับน้ำ" และ "เช็คสถานการณ์น้ำ" ร่วมกันอยู่ คาดว่าเป็นการติดตามข้อมูลเพื่อเฝ้าระวังปัญหาภัยแล้งหรือการบริหารจัดการน้ำในชุมชน'
};

// ── คำนวณ KEY_FINDINGS จาก rules จริง ──
function computeFindings(rules) {
  let bySeason = { Rainy: [], Winter: [], Summer: [] };

  for (let i = 0; i < rules.length; i++) {
    let r = rules[i];
    let season = parseSeason(r.Season !== undefined ? r.Season : r.season);
    if (!bySeason[season]) continue;
    bySeason[season].push(r);
  }

  let findings = [];
  let seasonKeys = ['Rainy', 'Winter', 'Summer'];

  for (let si = 0; si < seasonKeys.length; si++) {
    let seasonKey = seasonKeys[si];
    let seasonRules = bySeason[seasonKey];
    let config = SEASON_CONFIG[seasonKey];
    if (seasonRules.length === 0) continue;

    // นับจำนวนจังหวัด
    let provinceSet = {};
    for (let i = 0; i < seasonRules.length; i++) {
      let prov = seasonRules[i].Province !== undefined ? seasonRules[i].Province : seasonRules[i].province;
      if (prov) provinceSet[prov] = true;
    }
    let provinceCount = Object.keys(provinceSet).length;

    // คำนวณ confidence และ lift
    let sumConf = 0;
    let sumLift = 0;
    let maxLift = 0;
    let topRule = null;

    for (let i = 0; i < seasonRules.length; i++) {
      let r = seasonRules[i];
      let conf = Number(r.confidence) || 0;
      let lift = Number(r.lift) || 0;
      sumConf += conf;
      sumLift += lift;
      if (lift > maxLift) {
        maxLift = lift;
        topRule = r;
      }
    }

    let avgConf = Math.round((sumConf / seasonRules.length) * 10) / 10;
    let avgLift = Math.round((sumLift / seasonRules.length) * 100) / 100;

    // สร้างประโยคหลักให้เป็นภาษาพูดที่เป็นธรรมชาติ
    let topSentence = '';
    if (topRule !== null) {
      let ant = toArray(topRule.antecedents);
      let con = toArray(topRule.consequents);
      let antSearch = [];
      let antHasRain = false;
      for (let j = 0; j < ant.length; j++) {
        if (ant[j] === 'Rain_Heavy') { antHasRain = true; } else { antSearch.push(kwLabel(ant[j])); }
      }
      let conSearch = [];
      let conHasRain = false;
      for (let j = 0; j < con.length; j++) {
        if (con[j] === 'Rain_Heavy') { conHasRain = true; } else { conSearch.push(kwLabel(con[j])); }
      }

      if (antHasRain === true && antSearch.length === 0) {
        topSentence = 'เมื่อมีฝนตกหนักกว่าปกติ ประชาชนมักจะค้นหาข้อมูลเรื่อง "' + conSearch.join('" และ "') + '" ควบคู่ไปด้วย';
      } else if (antHasRain === false && conHasRain === true) {
        topSentence = 'คนที่ค้นหาคำว่า "' + antSearch.join('" และ "') + '" มักจะเป็นช่วงเดียวกับที่มีฝนตกหนักจริงในพื้นที่' + (conSearch.length > 0 ? ' ร่วมกับการค้นหา "' + conSearch.join('" "') + '"' : '');
      } else if (antSearch.length > 0 && conSearch.length > 0) {
        topSentence = 'ประชาชนที่ค้นหาคำว่า "' + antSearch.join('" และ "') + '" มักจะพิมพ์ค้นหาคำว่า "' + conSearch.join('" และ "') + '" ร่วมกันในเวลาเดียวกัน';
      } else {
        topSentence = 'พบพฤติกรรมการค้นหาที่คล้ายคลึงกันในกลุ่ม ' + provinceCount + ' จังหวัด';
      }
    }

    findings.push({
      id: si + 1,
      seasonKey: seasonKey,
      season: config.label,
      provinceCount: provinceCount,
      ruleCount: seasonRules.length,
      topSentence: topSentence,
      detail: SEASON_DETAIL[seasonKey],
      avgConf: avgConf,
      avgLift: avgLift,
      confHuman: confToHuman(avgConf),
      liftHuman: liftToHuman(avgLift),
      bgColor: config.bgColor,
      borderColor: config.borderColor,
      badgeColor: config.badgeColor,
    });
  }

  return findings;
}

// คำนวณเปอร์เซ็นต์ความเกี่ยวข้องกับฝน
function computeRainRelatedRules(rules) {
  if (rules.length === 0) return 0;
  let withRain = 0;
  for (let i = 0; i < rules.length; i++) {
    let r = rules[i];
    let ant = toArray(r.antecedents);
    let con = toArray(r.consequents);
    let found = false;
    for (let j = 0; j < ant.length; j++) { if (ant[j] === 'Rain_Heavy') found = true; }
    for (let j = 0; j < con.length; j++) { if (con[j] === 'Rain_Heavy') found = true; }
    if (found === true) withRain++;
  }
  return Math.round((withRain / rules.length) * 100);
}

// ── Component หลัก ──
export default function FloodPatternInsight() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCardId, setOpenCardId] = useState(null);

  useEffect(function () {
    Promise.all([
      fetch('/api/rules').then(res => res.json()),
      fetch('/api/rainfall').then(res => res.json()).catch(() => [])
    ]).then(function ([rulesData]) {
      setRules(rulesData || []);
      setLoading(false);
    });
  }, []);

  function handleToggleCard(id) {
    if (openCardId === id) { setOpenCardId(null); } else { setOpenCardId(id); }
  }

  if (loading === true) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  let findings = computeFindings(rules);
  let totalRules = rules.length;
  let rainRelatedPct = computeRainRelatedRules(rules);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      {/* <div className="bg-white rounded-2xl border border-sky-100 shadow-xl overflow-hidden">
        
        <div className="px-8 py-5">
          <p className="text-slate-600 text-[14px] leading-[1.8]">
            เมื่อเกิดสถานการณ์ภัยพิบัติหรือน้ำท่วม ประชาชนมักจะพิมพ์ค้นหาข้อมูล<strong>หลายคำพร้อมกันในเวลาเดียว</strong> เช่น ค้นหาคำว่า "น้ำท่วม" ควบคู่กับ "ระดับน้ำ" หรือ "เตรียมอพยพ" เพื่อหาข้อมูลที่รอบด้าน
          </p>
          <p className="text-slate-600 text-[14px] leading-[1.8] mt-2">
            ระบบนี้จึงทำการวิเคราะห์พฤติกรรมการค้นหาของประชาชนเปรียบเทียบกับสถิติน้ำฝนจริง เพื่อตรวจสอบว่าเสียงสะท้อนบนโลกอินเทอร์เน็ตสอดคล้องกับภัยธรรมชาติที่เกิดขึ้นในแต่ละพื้นที่อย่างไร
          </p>
        </div>
      </div> */}

      {/* ── ส่วนที่ 1: พฤติกรรมการค้นหาในแต่ละฤดูกาล ── */}
      <div>
      <h3 className="text-slate-900 text-[15px] px-1 mb-3">
        พฤติกรรมการค้นหาที่พบบ่อยในแต่ละฤดูกาล
      </h3>
        <div className="flex flex-col gap-4">
          {findings.map(function (finding) {
            let isOpen = false;
            if (openCardId === finding.id) { isOpen = true; }

            let cardClass = 'bg-white rounded-2xl border shadow-md overflow-hidden transition-all ' + finding.borderColor;
            let badgeClass = 'text-[11px] font-black px-3 py-1 rounded-full ' + finding.badgeColor;
            let detailBoxClass = 'mt-4 rounded-xl px-4 py-3 text-[13px] text-slate-600 leading-[1.8] ' + finding.bgColor;
            let buttonText = 'ดูรายละเอียดพฤติกรรม ▼';
            if (isOpen === true) { buttonText = 'ซ่อนรายละเอียด ▲'; }

            return (
              <div key={finding.id} className={cardClass}>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <span className={badgeClass}>{finding.season}</span>
                      <span className="text-[11px] text-slate-400 font-bold">พบใน {finding.provinceCount} จังหวัด</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-800 leading-[1.7]">
                        {finding.topSentence}
                      </p>
                      <button
                        onClick={function () { handleToggleCard(finding.id); }}
                        className="mt-2 text-[12px] text-sky-500 font-bold hover:text-sky-700 transition-colors"
                      >
                        {buttonText}
                      </button>
                    </div>
                  </div>

                  {isOpen === true && (
                    <div className={detailBoxClass}>
                      <p className="mb-4 font-medium text-slate-700">{finding.detail}</p>
                      <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 text-slate-600">
                        <div className="flex gap-2 items-start">
                          <span className="text-slate-400 shrink-0 mt-0.5">•</span>
                          <p className="text-[13px]">
                            <strong className="text-slate-700">ความสม่ำเสมอ:</strong> พฤติกรรมจับคู่คำนี้เกิดขึ้น{finding.confHuman} เมื่อตรวจสอบจากฐานข้อมูลย้อนหลัง
                          </p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <span className="text-slate-400 shrink-0 mt-0.5">•</span>
                          <p className="text-[13px]">
                            <strong className="text-slate-700">ระดับความเชื่อมโยง:</strong> {finding.liftHuman}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ส่วนที่ 2: ที่มาของข้อมูล ── */}
      <div className="bg-white rounded-2xl border border-sky-100 shadow-xl overflow-hidden">
        <div className="px-8 py-5 bg-gradient-to-r from-sky-500 to-sky-600 flex items-center gap-3">
          <h3 className="text-white font-black text-lg tracking-tight">รูปแบบพฤติกรรมเหล่านี้วิเคราะห์มาจากอะไร?</h3>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[14px] text-slate-700 leading-[1.8]">
                ระบบได้ประมวลผลสถิติคำค้นหาย้อนหลังแยกรายจังหวัดและรายเดือน โดยค้นพบรูปแบบกลุ่มคำที่มีการค้นหาควบคู่กันอย่างมีนัยสำคัญจำนวน <strong className="text-slate-800">{totalRules.toLocaleString()} รูปแบบ</strong>
              </p>
              <div className="mt-3 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                <p className="text-[13px] text-sky-700 font-bold">
                  ✓ ทุกรูปแบบที่แสดงบนเว็บไซต์ ผ่านการคัดเลือกจากข้อมูลจริง และแสดงเฉพาะรูปแบบที่เกิดขึ้นซ้ำอย่างมีนัยสำคัญ
                </p>
              </div>
              <p className="mt-3 text-[12px] text-slate-400 leading-[1.7] flex gap-1.5 items-start">
                <InfoOutlinedIcon style={{ fontSize: 13 }} className="mt-0.5 shrink-0" />
                <span>
                  หมายเหตุ: รูปแบบพฤติกรรมนี้อ้างอิงจากข้อมูลปริมาณน้ำฝนจริง, สถิติสภาวะฝนตกหนัก และแนวโน้มความสนใจของประชาชนในจังหวัด ปี และฤดูกาลเดียวกันเพื่อความถูกต้อง
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ส่วนที่ 3: ความสัมพันธ์กับน้ำฝนจริง ── */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-3">
          <VerifiedOutlinedIcon fontSize="small" className="text-emerald-600" />
          <h3 className="font-black text-slate-800 text-[15px]">ความเชื่อมโยงกับสภาพอากาศจริง</h3>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-[14px] text-slate-600 leading-[1.8]">
            จากรูปแบบความสัมพันธ์ทั้งหมด พบว่า<strong className="text-slate-800">{rainRelatedPct}%</strong> ของรูปแบบเกี่ยวข้องกับช่วงที่มีฝนตกหนักกว่าปกติ ในพื้นที่นั้นจริง ๆ แสดงให้เห็นว่าปัจจัยด้านฝนมักปรากฏร่วมกับพฤติกรรมการค้นหาของประชาชนในชุดข้อมูลที่นำมาวิเคราะห์ 
          </p>
{/* 
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] font-bold text-slate-500">สัดส่วนคำค้นหาที่เกิดขึ้นตรงกับช่วงฝนตกหนัก</span>
              <span className="text-[20px] font-black text-emerald-600">{rainRelatedPct}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                style={{ width: rainRelatedPct + '%' }}
              />
            </div>
          </div> */}

          <p className="text-[12px] text-slate-400 bg-slate-50 rounded-xl px-4 py-3 flex gap-2 items-start">
            <InfoOutlinedIcon style={{ fontSize: 14 }} className="text-slate-400 mt-0.5 shrink-0" />
            <span>
              แหล่งที่มาข้อมูล: ข้อมูลสถิติค้นหาจาก Google Trends · ข้อมูลปริมาณฝนจากสถาบันสารสนเทศทรัพยากรน้ำ (สสน.) · สถิติภัยพิบัติจากกรมป้องกันและบรรเทาสาธารณภัย (ปภ.) ครอบคลุมปี 2561–2568
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}