import { db } from "@/db";
import { markets, users, bets, validatorVotes } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const marketId = parseInt(id);

  const [market] = await db
    .select({
      id: markets.id,
      title: markets.title,
      description: markets.description,
      category: markets.category,
      imageUrl: markets.imageUrl,
      status: markets.status,
      yesPool: markets.yesPool,
      noPool: markets.noPool,
      resolvedOutcome: markets.resolvedOutcome,
      resolverNote: markets.resolverNote,
      oracleType: markets.oracleType,
      oracleTicker: markets.oracleTicker,
      oracleCondition: markets.oracleCondition,
      closesAt: markets.closesAt,
      resolvedAt: markets.resolvedAt,
      createdAt: markets.createdAt,
      creatorUsername: users.username,
      creatorDisplay: users.displayName,
      creatorTelegram: users.telegramId,
    })
    .from(markets)
    .leftJoin(users, eq(markets.creatorId, users.id))
    .where(eq(markets.id, marketId))
    .limit(1);

  if (!market) return Response.json({ error: "Not found" }, { status: 404 });

  // Bet counts
  const [betStats] = await db
    .select({
      totalBets: sql<number>`count(*)::int`,
      yesBets: sql<number>`sum(case when side='yes' then 1 else 0 end)::int`,
      noBets: sql<number>`sum(case when side='no' then 1 else 0 end)::int`,
    })
    .from(bets)
    .where(eq(bets.marketId, marketId));

  // Vote counts
  const [voteStats] = await db
    .select({
      yesVotes: sql<number>`sum(case when vote='yes' then 1 else 0 end)::int`,
      noVotes: sql<number>`sum(case when vote='no' then 1 else 0 end)::int`,
    })
    .from(validatorVotes)
    .where(eq(validatorVotes.marketId, marketId));

  return Response.json({ ...market, betStats, voteStats });
}
