import 'server-only';


const store = {};
const refreshing = {};

// โหลดข้อมูลใหม่เบื้องหลัง ผู้ใช้ที่ขอเข้ามาตอนนี้ไม่ต้องรอ
async function refreshInBackground(key, loader) {
  try {
    const data = await loader();
    store[key] = { data: data, savedAt: Date.now() };
  } catch {
    // โหลดใหม่ไม่สำเร็จ ให้ใช้ข้อมูลเดิมต่อไปจนกว่าจะโหลดได้
  }
  refreshing[key] = false;
}

export async function getCached(key, maxAgeMs, loader) {
  const entry = store[key];

  if (entry) {
    const age = Date.now() - entry.savedAt;

    if (age < maxAgeMs) {
      return entry.data;
    }

    // ข้อมูลเก่ากว่าที่กำหนดแล้ว แต่ยังพอใช้ได้ จึงส่งของเดิมกลับไปก่อน
    // แล้วค่อยโหลดใหม่ไว้ให้คำขอครั้งถัดไป ไม่ให้ผู้ใช้ต้องรอ API ที่ตอบช้า
    if (!refreshing[key]) {
      refreshing[key] = true;
      refreshInBackground(key, loader);
    }

    return entry.data;
  }

  const data = await loader();
  store[key] = { data: data, savedAt: Date.now() };
  return data;
}

export const TEN_MINUTES = 10 * 60 * 1000;
