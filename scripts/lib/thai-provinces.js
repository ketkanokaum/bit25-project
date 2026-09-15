// lib/constants/provinces.js is ESM ("export const ...") and scripts/ runs
// as plain CommonJS, so the province list is duplicated here rather than
// required — keep the Thai names in sync with lib/constants/provinces.js.
//
// Open-Meteo's geocoder (GeoNames-backed) does not index Thai-script names —
// querying "ขอนแก่น" returns zero results, only the romanized "Khon Kaen"
// resolves. So scripts geocode by English/RTGS name but still store the
// Thai name in the DB (that's what the app's tables and UI use).
const PROVINCE_EN_NAME = {
  เชียงราย: "Chiang Rai", น่าน: "Nan", พะเยา: "Phayao", เชียงใหม่: "Chiang Mai",
  แม่ฮ่องสอน: "Mae Hong Son", แพร่: "Phrae", ลำปาง: "Lampang", ลำพูน: "Lamphun", อุตรดิตถ์: "Uttaradit",
  กรุงเทพมหานคร: "Bangkok", พิษณุโลก: "Phitsanulok", สุโขทัย: "Sukhothai", เพชรบูรณ์: "Phetchabun",
  พิจิตร: "Phichit", กำแพงเพชร: "Kamphaeng Phet", นครสวรรค์: "Nakhon Sawan", ลพบุรี: "Lop Buri",
  ชัยนาท: "Chai Nat", อุทัยธานี: "Uthai Thani", สิงห์บุรี: "Sing Buri", อ่างทอง: "Ang Thong",
  สระบุรี: "Saraburi", พระนครศรีอยุธยา: "Phra Nakhon Si Ayutthaya", สุพรรณบุรี: "Suphan Buri", นครนายก: "Nakhon Nayok",
  ปทุมธานี: "Pathum Thani", นนทบุรี: "Nonthaburi", นครปฐม: "Nakhon Pathom", สมุทรปราการ: "Samut Prakan",
  สมุทรสาคร: "Samut Sakhon", สมุทรสงคราม: "Samut Songkhram",
  หนองคาย: "Nong Khai", นครพนม: "Nakhon Phanom", สกลนคร: "Sakon Nakhon", อุดรธานี: "Udon Thani",
  หนองบัวลำภู: "Nong Bua Lamphu", เลย: "Loei", มุกดาหาร: "Mukdahan", กาฬสินธุ์: "Kalasin",
  ขอนแก่น: "Khon Kaen", อำนาจเจริญ: "Amnat Charoen", ยโสธร: "Yasothon", ร้อยเอ็ด: "Roi Et",
  มหาสารคาม: "Maha Sarakham", ชัยภูมิ: "Chaiyaphum", นครราชสีมา: "Nakhon Ratchasima",
  บุรีรัมย์: "Buri Ram", สุรินทร์: "Surin", ศรีสะเกษ: "Si Sa Ket", อุบลราชธานี: "Ubon Ratchathani",
  บึงกาฬ: "Bueng Kan",
  สระแก้ว: "Sa Kaeo", ปราจีนบุรี: "Prachin Buri", ฉะเชิงเทรา: "Chachoengsao", ชลบุรี: "Chon Buri",
  ระยอง: "Rayong", จันทบุรี: "Chanthaburi", ตราด: "Trat",
  ตาก: "Tak", กาญจนบุรี: "Kanchanaburi", ราชบุรี: "Ratchaburi", เพชรบุรี: "Phetchaburi",
  ประจวบคีรีขันธ์: "Prachuap Khiri Khan",
  ชุมพร: "Chumphon", ระนอง: "Ranong", สุราษฎร์ธานี: "Surat Thani", นครศรีธรรมราช: "Nakhon Si Thammarat",
  กระบี่: "Krabi", พังงา: "Phang Nga", ภูเก็ต: "Phuket", พัทลุง: "Phatthalung", ตรัง: "Trang",
  ปัตตานี: "Pattani", สงขลา: "Songkhla", สตูล: "Satun", นราธิวาส: "Narathiwat", ยะลา: "Yala",
};
const ALL_PROVINCES = Object.keys(PROVINCE_EN_NAME);

module.exports = { PROVINCE_EN_NAME, ALL_PROVINCES };
