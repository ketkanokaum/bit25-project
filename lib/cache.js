import 'server-only';

// เก็บผลลัพธ์ไว้ในหน่วยความจำของ server ชั่วคราว
// ถ้ายังไม่หมดอายุให้ใช้ของเดิม ไม่ต้องไปถามฐานข้อมูลหรือ API ใหม่
// ถ้า loader เกิด error จะไม่เก็บอะไรไว้ ครั้งหน้าจึงลองใหม่เอง
const store = {};

export async function getCached(key, maxAgeMs, loader) {
  const entry = store[key];
  if (entry && Date.now() - entry.savedAt < maxAgeMs) {
    return entry.data;
  }

  const data = await loader();
  store[key] = { data: data, savedAt: Date.now() };
  return data;
}

export const TEN_MINUTES = 10 * 60 * 1000;
