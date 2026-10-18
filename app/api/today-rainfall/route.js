import { NextResponse } from 'next/server';
import { getTodayRainfallByProvince } from '@/lib/data/live-rainfall';

export async function GET() {
  try {
    const data = await getTodayRainfallByProvince();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}
