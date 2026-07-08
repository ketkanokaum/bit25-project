import { getRainfallWithImpact } from '@/lib/data/rainfall';

export async function GET() {
  const data = await getRainfallWithImpact();
  return Response.json(data);
}