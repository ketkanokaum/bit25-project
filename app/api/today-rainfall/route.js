import { NextResponse } from 'next/server';
import { getTodayRainfallByProvince } from '@/lib/data/live-rainfall';

export async function GET() {
  // ข้อมูลมาจาก API ภายนอกที่บางครั้งตอบช้ามาก ถ้าเรียกไม่ได้ให้ส่งค่าว่างกลับไป
  // หน้าเว็บจะแสดงส่วนอื่นได้ตามปกติ ไม่ค้างรอ
  try {
    const data = await getTodayRainfallByProvince();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}
