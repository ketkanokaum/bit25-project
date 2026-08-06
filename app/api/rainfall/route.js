import { getRainfallData } from '@/lib/data/rainfall';

export async function GET() {
  const data = await getRainfallData();
  return Response.json(data);
}