"use client";

import React, { useState, useEffect } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// ── ข้อมูล insight ที่คำนวณจาก Apriori ไว้ล่วงหน้าแล้ว ──
// ที่มา: association_rules.csv (วิเคราะห์ด้วย Apriori Algorithm)
const TOTAL_RULES = 7916;
const TOTAL_PROVINCES = 71;
const DATA_YEAR_RANGE = "2561–2567";
const DATA_UPDATED_AT = "กรกฎาคม 2569";

// รายชื่อจังหวัดตัวอย่างที่แสดงในการ์ด (ไม่ครบทั้งหมด แต่ใช้สำหรับค้นหาด้านล่างได้ครบ)
const KEY_FINDINGS = [
  {
    id: 1,
    season: "ฤดูฝน",
    provinceCount: 68,
    ruleCount: 4520,
    sentence:
      "เมื่อฝนตกหนักกว่าค่าเฉลี่ย ประชาชนใน 68 จังหวัดมักค้นหาคำว่า \"น้ำท่วม\" คู่กับ \"พายุ\" หรือ \"ระดับน้ำ\" พร้อมกันเสมอ ไม่ใช่ทีละคำ",
    detail:
      "สะท้อนว่าประชาชนรับรู้น้ำท่วมในฤดูฝนในฐานะเหตุการณ์รุนแรงที่มาพร้อมพายุ ไม่ใช่แค่ฝนตกธรรมดา",
    confidence: 85.2,
    lift: 2.49,
    exampleProvinces: [
      "กรุงเทพมหานคร",
      "เชียงใหม่",
      "นครราชสีมา",
      "สุราษฎร์ธานี",
      "อุบลราชธานี",
      "ขอนแก่น",
      "สงขลา",
      "ตาก",
    ],
    fullProvinces: [
      "กรุงเทพมหานคร","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","พระนครศรีอยุธยา","พะเยา","พิจิตร","พิษณุโลก","ภูเก็ต","มหาสารคาม","มุกดาหาร","ยโสธร","ระยอง","ราชบุรี","ร้อยเอ็ด","ลพบุรี","ลำปาง","ลำพูน","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระบุรี","สระแก้ว","สิงห์บุรี","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","สุโขทัย","หนองคาย","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี","อ่างทอง","เชียงราย","เชียงใหม่","เพชรบุรี","เพชรบูรณ์","เลย","แพร่",
    ],
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    badgeColor: "bg-sky-100 text-sky-700",
  },
  {
    id: 2,
    season: "ฤดูหนาว",
    provinceCount: 28,
    ruleCount: 2236,
    sentence:
      "ในฤดูหนาว ประชาชนใน 28 จังหวัดค้นหา \"น้ำท่วม\" โดยตรงเมื่อฝนตกหนัก โดยไม่มีคำอื่นร่วมด้วย",
    detail:
      "ต่างจากฤดูฝน สะท้อนว่าน้ำท่วมฤดูหนาว ซึ่งส่วนใหญ่เกิดในภาคใต้ เป็นเหตุการณ์ที่ประชาชนคุ้นเคยและตอบสนองตรงจุด",
    confidence: 88.9,
    lift: 2.67,
    exampleProvinces: [
      "นครศรีธรรมราช",
      "สงขลา",
      "ชุมพร",
      "ยะลา",
      "ปัตตานี",
      "สุราษฎร์ธานี",
      "เชียงใหม่",
    ],
    fullProvinces: [
      "กรุงเทพมหานคร","กำแพงเพชร","ขอนแก่น","ฉะเชิงเทรา","ชลบุรี","ชุมพร","นครปฐม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","ปทุมธานี","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","ยะลา","ระนอง","ระยอง","ลำพูน","สงขลา","สมุทรปราการ","สมุทรสาคร","สระบุรี","สุราษฎร์ธานี","สุรินทร์","อุบลราชธานี","เชียงราย","เชียงใหม่",
    ],
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: 3,
    season: "ฤดูร้อน",
    provinceCount: 25,
    ruleCount: 1160,
    sentence:
      "ในฤดูร้อน ประชาชนใน 25 จังหวัดค้นหา \"ระดับน้ำ\" คู่กับ \"น้ำท่วม\" เมื่อฝนตกหนัก",
    detail:
      "สะท้อนความกังวลเรื่องน้ำแล้งสลับกับน้ำท่วม และการติดตามสถานการณ์น้ำในแหล่งเก็บกักน้ำ",
    confidence: 88.1,
    lift: 2.2,
    exampleProvinces: [
      "เชียงใหม่",
      "ยะลา",
      "นครศรีธรรมราช",
      "หนองคาย",
      "แพร่",
      "ลำปาง",
      "พิษณุโลก",
      "อุบลราชธานี",
    ],
    fullProvinces: [
      "กรุงเทพมหานคร","ขอนแก่น","ฉะเชิงเทรา","ชลบุรี","นครปฐม","นครราชสีมา","นครศรีธรรมราช","นนทบุรี","ปทุมธานี","ประจวบคีรีขันธ์","ปัตตานี","พระนครศรีอยุธยา","พิษณุโลก","ยะลา","ระยอง","ลำปาง","ลำพูน","ศรีสะเกษ","สมุทรปราการ","สุราษฎร์ธานี","สุโขทัย","หนองคาย","อุบลราชธานี","เชียงใหม่","แพร่",
    ],
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    badgeColor: "bg-amber-100 text-amber-700",
  },
];

const SIGNAL_MATCH_PCT = 79;
const SIGNAL_SENTENCE =
  "ในปี 2566 ซึ่งเป็นปีเดียวที่มีบันทึกจำนวนผู้ได้รับผลกระทบไว้ชัดเจน พบว่า 15 จาก 19 จังหวัด (79%) ที่มีรูปแบบการค้นหา \"น้ำท่วม\" สูง สอดคล้องกับจังหวัดที่เกิดน้ำท่วมจริงด้วย";
const SIGNAL_IMPLICATION =
  "นี่คือการตรวจสอบข้ามกับข้อมูลผู้ได้รับผลกระทบจริงจากกรมป้องกันและบรรเทาสาธารณภัย ไม่ใช่การตีความจากกฎ Apriori เพียงอย่างเดียว";
const SIGNAL_CAVEAT =
  "ข้อมูลผู้ได้รับผลกระทบบันทึกครบถ้วนเฉพาะปี 2566 เท่านั้น ปีอื่นในฐานข้อมูลไม่มีตัวเลขเชิงปริมาณให้ตรวจสอบ จึงไม่สามารถยืนยันย้อนหลังได้ทั้งหมด";

const RELIABILITY_PCT = 44.2;
const RELIABILITY_SENTENCE =
  "จากกฎ Apriori ทั้งหมด 7,916 กฎ พบว่า 44.2% เป็นกฎที่เชื่อมโยงกับการเกิดฝนตกหนักจริง เมื่อเปรียบเทียบกับข้อมูลฝนของสถาบันสารสนเทศทรัพยากรน้ำ (สสน.)";

// ── ฟังก์ชันช่วยหาว่าตอนนี้อยู่ในฤดูอะไร (ใช้ if-else ธรรมดา) ──
function getCurrentSeasonName() {
  const monthIndex = new Date().getMonth(); // 0 = มกราคม
  let seasonName = "";

  if (monthIndex === 4 || monthIndex === 5 || monthIndex === 6 || monthIndex === 7 || monthIndex === 8 || monthIndex === 9) {
    seasonName = "ฤดูฝน";
  } else if (monthIndex === 10 || monthIndex === 11 || monthIndex === 0 || monthIndex === 1) {
    seasonName = "ฤดูหนาว";
  } else {
    seasonName = "ฤดูร้อน";
  }

  return seasonName;
}

// ── Component หลัก ──
export default function FloodPatternInsight() {
  const [isClient, setIsClient] = useState(false);
  const [openCardId, setOpenCardId] = useState(1); // เปิดการ์ดแรกไว้ก่อน ให้ผู้ใช้รู้ว่ากดได้
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSeasonName, setCurrentSeasonName] = useState("");

  useEffect(function () {
    setIsClient(true);
    setCurrentSeasonName(getCurrentSeasonName());
  }, []);

  if (isClient === false) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  function handleToggleCard(id) {
    if (openCardId === id) {
      setOpenCardId(null);
    } else {
      setOpenCardId(id);
    }
  }

  // ค้นหาว่าจังหวัดที่พิมพ์ อยู่ในรูปแบบของฤดูกาลไหนบ้าง (เขียนแบบ loop ธรรมดา ไม่ใช้ฟังก์ชันขั้นสูง)
  function handleSearchChange(event) {
    const text = event.target.value;
    setSearchText(text);

    if (text.trim() === "") {
      setSearchResults([]);
      return;
    }

    const matchedSeasons = [];

    for (let i = 0; i < KEY_FINDINGS.length; i++) {
      const finding = KEY_FINDINGS[i];
      let foundInThisSeason = false;

      for (let j = 0; j < finding.fullProvinces.length; j++) {
        const provinceName = finding.fullProvinces[j];
        if (provinceName.indexOf(text.trim()) !== -1) {
          foundInThisSeason = true;
        }
      }

      if (foundInThisSeason === true) {
        matchedSeasons.push(finding.season);
      }
    }

    setSearchResults(matchedSeasons);
  }

  return (
    <div className="space-y-6">

      {/* ── หัวข้อหน้า ── */}
      <div className="px-1">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          จับสัญญาณน้ำท่วม จากพฤติกรรมการค้นหาของคนไทย
        </h1>
        <p className="text-slate-500 text-[13px] mt-1">
          ข้อมูลวิเคราะห์ครอบคลุมปี พ.ศ. {DATA_YEAR_RANGE} · ปรับปรุงล่าสุด {DATA_UPDATED_AT}
        </p>
      </div>

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-sky-100 shadow-xl overflow-hidden">
        <div className="px-8 py-5 bg-gradient-to-r from-sky-500 to-sky-600 flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl text-white">
            <SearchIcon fontSize="small" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-tight">รูปแบบการค้นหาของประชาชนเมื่อเกิดน้ำท่วม</h2>
            <p className="text-sky-100 text-[13px] mt-0.5">
              วิเคราะห์จาก {TOTAL_RULES.toLocaleString()} ความสัมพันธ์ใน {TOTAL_PROVINCES} จังหวัด ด้วย Apriori Algorithm
            </p>
          </div>
        </div>
        <div className="px-8 py-5">
          <p className="text-slate-600 text-[14px] leading-[1.8]">
            คนไทยไม่ได้ค้นหาคำเรื่องน้ำท่วมทีละคำ แต่ค้นหาเป็น <strong className="text-slate-800">กลุ่มคำ</strong> ที่มักปรากฏร่วมกัน
          </p>
          <p className="text-slate-600 text-[14px] leading-[1.8] mt-2">
            รูปแบบเหล่านี้มีความสอดคล้องกับข้อมูลปริมาณฝนและเหตุการณ์น้ำท่วมจริงในหลายพื้นที่ ไม่ใช่เพียงกระแสข่าวบนสื่อออนไลน์
          </p>

          {currentSeasonName === "ฤดูฝน" && (
            <div className="mt-4 inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-[12px] font-bold px-4 py-2 rounded-full">
              <WaterDropIcon style={{ fontSize: 15 }} />
              ตอนนี้อยู่ในช่วงฤดูฝน ซึ่งเป็นฤดูที่เข้าเกณฑ์เฝ้าระวังมากที่สุดจากข้อมูล
            </div>
          )}
        </div>
      </div>

      {/* ── ค้นหาจังหวัดของฉัน ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <PlaceOutlinedIcon fontSize="small" className="text-slate-500" />
          <h3 className="font-black text-slate-800 text-[15px]">จังหวัดของฉันอยู่ในกลุ่มไหนบ้าง?</h3>
        </div>
        <div className="p-6">
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="พิมพ์ชื่อจังหวัด เช่น เชียงใหม่, สงขลา"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />

          {searchText.trim() !== "" && searchResults.length === 0 && (
            <p className="mt-3 text-[13px] text-slate-400">ไม่พบจังหวัดนี้ในข้อมูลรูปแบบการค้นหาที่วิเคราะห์ไว้</p>
          )}

          {searchResults.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchResults.map(function (seasonName, index) {
                return (
                  <span
                    key={index}
                    className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-sky-100 text-sky-700"
                  >
                    เข้าเกณฑ์ในช่วง {seasonName}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── เปรียบเทียบ 3 ฤดูกาลแบบภาพ ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800 text-[15px]">เทียบจำนวนจังหวัดที่เข้าเกณฑ์ในแต่ละฤดูกาล</h3>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {KEY_FINDINGS.map(function (finding) {
            const barWidthPct = (finding.provinceCount / TOTAL_PROVINCES) * 100;

            return (
              <div key={finding.id} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[12px] font-bold text-slate-500">{finding.season}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={"h-6 rounded-full flex items-center justify-end pr-2 " + finding.badgeColor}
                    style={{ width: barWidthPct + "%" }}
                  >
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right text-[13px] font-black text-slate-700">
                  {finding.provinceCount} จังหวัด
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ส่วนที่ 1: รูปแบบแต่ละฤดูกาล ── */}
      <div>
        <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3">
          รูปแบบที่พบตามฤดูกาล
        </h3>
        <div className="flex flex-col gap-4">
          {KEY_FINDINGS.map(function (finding) {
            let isOpen = false;
            if (openCardId === finding.id) {
              isOpen = true;
            }

            let isCurrentSeason = false;
            if (finding.season === currentSeasonName) {
              isCurrentSeason = true;
            }

            let cardClass = "bg-white rounded-2xl border shadow-md overflow-hidden transition-all " + finding.borderColor;
            let badgeClass = "text-[11px] font-black px-3 py-1 rounded-full " + finding.badgeColor;
            let detailBoxClass = "mt-4 rounded-xl px-4 py-3 text-[13px] text-slate-600 leading-[1.7] " + finding.bgColor;

            let buttonText = "หมายความว่าอะไร? ▼";
            if (isOpen === true) {
              buttonText = "ซ่อน ▲";
            }

            return (
              <div key={finding.id} className={cardClass}>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <span className={badgeClass}>{finding.season}</span>
                      <span className="text-[11px] text-slate-400 font-bold">{finding.provinceCount} จังหวัด</span>
                      {isCurrentSeason === true && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          เฝ้าระวังตอนนี้
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-800 leading-[1.7]">{finding.sentence}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {finding.exampleProvinces.map(function (provinceName, index) {
                          return (
                            <span
                              key={index}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600"
                            >
                              {provinceName}
                            </span>
                          );
                        })}
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-400">
                          และอีก {finding.provinceCount - finding.exampleProvinces.length} จังหวัด
                        </span>
                      </div>

                      <button
                        onClick={function () { handleToggleCard(finding.id); }}
                        className="mt-3 text-[12px] text-sky-500 font-bold hover:text-sky-700 transition-colors"
                      >
                        {buttonText}
                      </button>
                    </div>
                  </div>

                  {isOpen === true && (
                    <div className={detailBoxClass}>
                      <p>{finding.detail}</p>
                      <div className="mt-3 flex gap-6 flex-wrap">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                            Confidence (ความเชื่อมั่นเฉลี่ย)
                          </span>
                          <span className="text-[18px] font-black text-emerald-600">{finding.confidence}%</span>
                          <span className="text-[11px] text-slate-400 max-w-[220px]">
                            เมื่อมีการค้นหาคำแรก มีโอกาส {finding.confidence}% ที่จะพบคำที่สัมพันธ์กันร่วมด้วยในชุดข้อมูลนี้
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Lift เฉลี่ย</span>
                          <span className="text-[18px] font-black text-orange-500">{finding.lift}x</span>
                          <span className="text-[11px] text-slate-400 max-w-[220px]">
                            คำทั้งสองมีโอกาสเกิดร่วมกันมากกว่าการเกิดแบบบังเอิญประมาณ {finding.lift} เท่า จากทั้งหมด {finding.ruleCount.toLocaleString()} กฎในฤดูนี้
                          </span>
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

      {/* ── ส่วนที่ 2: ตรวจสอบกับเหตุการณ์จริง ── */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
          <WaterDropIcon fontSize="small" className="text-red-500" />
          <h3 className="font-black text-slate-800 text-[15px]">ตรวจสอบกับเหตุการณ์น้ำท่วมจริง</h3>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-red-500 flex flex-col items-center justify-center shadow-md">
              <span className="text-white font-black text-[22px] leading-none">{SIGNAL_MATCH_PCT}%</span>
              <span className="text-white/80 text-[9px] font-bold leading-tight text-center">
                สอดคล้อง<br />กับข้อมูลจริง
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-slate-400 mb-1">วัดว่า: กฎที่พบ ตรงกับจังหวัดที่เกิดน้ำท่วมจริงหรือไม่ (เฉพาะปี 2566)</p>
              <p className="text-[14px] text-slate-700 leading-[1.8]">{SIGNAL_SENTENCE}</p>
              <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-[13px] text-red-700 font-bold leading-[1.7]">{SIGNAL_IMPLICATION}</p>
              </div>
              <p className="mt-3 text-[12px] text-slate-400 leading-[1.7] flex gap-1.5 items-start">
                <InfoOutlinedIcon style={{ fontSize: 13 }} className="mt-0.5 shrink-0" />
                {SIGNAL_CAVEAT}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ส่วนที่ 3: ความน่าเชื่อถือ ── */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-3">
          <VerifiedOutlinedIcon fontSize="small" className="text-emerald-600" />
          <h3 className="font-black text-slate-800 text-[15px]">ข้อมูลนี้น่าเชื่อถือแค่ไหน?</h3>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-[13px] text-slate-400">วัดว่า: กฎ Apriori ทั้งหมดในระบบ ตรงกับข้อมูลปริมาณฝนจริงมากแค่ไหน (ต่างจากตัวเลข 79% ด้านบนที่วัดเฉพาะปี 2566)</p>
          <p className="text-[14px] text-slate-600 leading-[1.8]">{RELIABILITY_SENTENCE}</p>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] font-bold text-slate-500">กฎที่สอดคล้องกับปริมาณน้ำฝนจริง</span>
              <span className="text-[20px] font-black text-emerald-600">{RELIABILITY_PCT}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                style={{ width: RELIABILITY_PCT + "%" }}
              />
            </div>
          </div>

          <p className="text-[12px] text-slate-400 bg-slate-50 rounded-xl px-4 py-3 flex gap-2 items-start">
            <InfoOutlinedIcon style={{ fontSize: 14 }} className="text-slate-400 mt-0.5 shrink-0" />
            <span>
              วิเคราะห์โดยเปรียบเทียบกับข้อมูลปริมาณน้ำฝนจากสถาบันสารสนเทศทรัพยากรน้ำ (สสน.)
              และสถิติน้ำท่วมจากกรมป้องกันและบรรเทาสาธารณภัย ปี {DATA_YEAR_RANGE}
              ใช้เกณฑ์ Support ≥ 10% และ Lift ≥ 1.15 ในการคัดเลือกกฎ
            </span>
          </p>

          <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-2 items-start">
            <InfoOutlinedIcon style={{ fontSize: 14 }} className="text-amber-500 mt-0.5 shrink-0" />
            <span>
              ผลที่แสดงคือ <strong>ความสัมพันธ์ (association)</strong> ของพฤติกรรมการค้นหา ไม่ได้พิสูจน์ว่าเป็นสาเหตุของน้ำท่วม
              จึงไม่สามารถสรุปผลในเชิงเหตุและผล หรือยืนยันความแม่นยำในทุกปีได้
              และตรวจสอบกับเหตุการณ์จริงได้เฉพาะปี 2566 ซึ่งเป็นปีที่มีข้อมูลผู้ได้รับผลกระทบครบถ้วน
            </span>
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="https://www.thaiwater.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-4 py-2 rounded-full hover:bg-sky-100 transition-colors"
            >
              ข้อมูลฝน จาก สสน. <OpenInNewIcon style={{ fontSize: 13 }} />
            </a>
            <a
              href="https://www.disaster.go.th"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-4 py-2 rounded-full hover:bg-sky-100 transition-colors"
            >
              ข้อมูลเหตุการณ์ จาก ปภ. <OpenInNewIcon style={{ fontSize: 13 }} />
            </a>
          </div>
        </div>
      </div>

      {/* ── ส่วนที่ 4: แล้วฉันควรทำอะไร ── */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl shadow-md overflow-hidden">
        <div className="p-6 flex items-start gap-4">
          <div className="p-2.5 bg-white/20 rounded-xl text-white shrink-0">
            <WaterDropIcon fontSize="small" />
          </div>
          <div>
            <h3 className="font-black text-white text-[15px]">ถ้าจังหวัดของคุณเข้าเกณฑ์เฝ้าระวัง ควรทำอะไรต่อ?</h3>
            <p className="text-sky-50 text-[13px] leading-[1.8] mt-1">
              ติดตามสถานการณ์น้ำแบบเรียลไทม์ และประกาศเตือนภัยจากหน่วยงานที่เกี่ยวข้องอย่างต่อเนื่อง โดยเฉพาะในช่วงฤดูฝนซึ่งเป็นช่วงที่ข้อมูลนี้ชี้ว่ามีความเสี่ยงสูงสุด
            </p>
            <a
              href="https://www.thaiwater.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-black text-sky-700 bg-white px-4 py-2 rounded-full hover:bg-sky-50 transition-colors"
            >
              ติดตามสถานการณ์น้ำตอนนี้ <OpenInNewIcon style={{ fontSize: 13 }} />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}