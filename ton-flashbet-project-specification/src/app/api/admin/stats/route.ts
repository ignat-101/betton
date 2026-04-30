import { db } from "@/db";
import { markets, users, bets, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telegramId = searchParams.get("telegramId");

  if (!telegramId) return Response.json({ error: "Missing telegramId" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  if (!user || !user.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [marketCount] = await db.select({ count: sql<number>`count(*)::int` }).from(markets);
  const [betCount] = await db.select({ count: sql<number>`count(*)::int` }).from(bets);
  const [pendingMarkets] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(markets)
    .where(eq(markets.status, "pending"));
  const [activeMarkets] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(markets)
    .where(eq(markets.status, "active"));

  const [totalVolume] = await db
    .select({ total: sql<number>`sum(amount::numeric)::float` })
    .from(bets);

  return Response.json({
    users: userCount.count,
    markets: marketCount.count,
    bets: betCount.count,
    pendingMarkets: pendingMarkets.count,
    activeMarkets: activeMarkets.count,
    totalVolume: totalVolume.total ?? 0,
  });
}
