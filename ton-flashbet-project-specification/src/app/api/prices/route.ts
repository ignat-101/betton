import { getTopCoins } from "@/lib/coingecko";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET() {
  const coins = await getTopCoins();
  return Response.json(coins);
}
