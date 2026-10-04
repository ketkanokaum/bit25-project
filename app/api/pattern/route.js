import { NextResponse } from 'next/server';
import { getProvincePatternData } from '@/lib/data/pattern';
import { provinceRegions } from '@/lib/constants/provinces';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');

  if (!province || !(province in provinceRegions)) {
    return NextResponse.json({ error: 'invalid province' }, { status: 400 });
  }

  const result = await getProvincePatternData(province);
  return NextResponse.json(result);
}
