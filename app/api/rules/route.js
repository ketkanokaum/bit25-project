import { getAssociationRules } from '@/lib/data/rules';

export async function GET() {
  const data = await getAssociationRules();
  return Response.json(data);
}