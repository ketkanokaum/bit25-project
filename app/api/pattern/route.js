import { NextResponse } from 'next/server';
import { getProvincePatternData } from '@/lib/data/pattern';
import { provinceRegions } from '@/lib/constants/provinces';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');

  if (!province || !Object.hasOwn(provinceRegions, province)) {
    return NextResponse.json({ error: 'invalid province' }, { status: 400 });
  }

  try {
    const result = await getProvincePatternData(province);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  }
}
