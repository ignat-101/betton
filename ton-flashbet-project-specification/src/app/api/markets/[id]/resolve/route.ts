import { db } from "@/db";
import { markets, users, bets, transactions, validatorVotes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { evaluateOracleCondition } from "@/lib/coingecko";

export const dynamic = "force-dynamic";

// POST /api/markets/[id]/resolve — admin resolves market
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const marketId = parseInt(id);

  const body = await req.json();
  const { telegramId, outcome, resolverNote, useOracle } = body;

  if (!telegramId) return Response.json({ error: "Missing telegramId" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  if (!user || !user.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [market] = await db.select().from(markets).where(eq(markets.id, marketId)).limit(1);
  if (!market) return Response.json({ error: "Market not found" }, { status: 404 });
  if (market.status !== "active" && market.status !== "closed") {
    return Response.json({ error: "Market not in active/closed state" }, { status: 400 });
  }

  let finalOutcome: "yes" | "no" = outcome;

  // Oracle check
  if (useOracle && market.oracleType === "coingecko" && market.oracleTicker && market.oracleCondition) {
    const result = await evaluateOracleCondition(market.oracleTicker, market.oracleCondition);
    if (result !== null) {
      finalOutcome = result ? "yes" : "no";
    }
  }

  // Check validator votes consensus
  const [votes] = await db
    .select({
      yesVotes: sql<number>`sum(case when vote='yes' then 1 else 0 end)::int`,
      noVotes: sql<number>`sum(case when vote='no' then 1 else 0 end)::int`,
    })
    .from(validatorVotes)
    .where(eq(validatorVotes.marketId, marketId));

  const totalVotes = (votes.yesVotes ?? 0) + (votes.noVotes ?? 0);
  let consensusOutcome: "yes" | "no" | null = null;
  if (totalVotes >= 3) {
    consensusOutcome = (votes.yesVotes ?? 0) > (votes.noVotes ?? 0) ? "yes" : "no";
  }

  // Final outcome: oracle > consensus > admin
  if (useOracle && market.oracleType === "coingecko") {
    // already set above
  } else if (consensusOutcome) {
    finalOutcome = consensusOutcome;
  }

  // Update market
  await db
    .update(markets)
    .set({
      status: "resolved",
      resolvedOutcome: finalOutcome,
      resolverNote,
      resolverId: user.id,
      resolvedAt: new Date(),
    })
    .where(eq(markets.id, marketId));

  // Pay out winning bets
  const winningBets = await db
    .select()
    .from(bets)
    .where(and(eq(bets.marketId, marketId), eq(bets.side, finalOutcome), eq(bets.paid, false)));

  const yesPool = parseFloat(market.yesPool);
  const noPool = parseFloat(market.noPool);
  const totalPool = yesPool + noPool;
  const winPool = finalOutcome === "yes" ? yesPool : noPool;

  for (const bet of winningBets) {
    const shares = parseFloat(bet.shares);
    const payout = winPool > 0 ? (shares / winPool) * totalPool * 0.97 : 0;

    await db
      .update(bets)
      .set({ paid: true, payout: String(payout) })
      .where(eq(bets.id, bet.id));

    await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${payout}` })
      .where(eq(users.id, bet.userId));

    await db.insert(transactions).values({
      userId: bet.userId,
      type: "payout",
      amount: String(payout),
      description: `Payout for market #${marketId}`,
      marketId,
    });
  }

  // Reward correct validators
  const correctVoters = await db
    .select()
    .from(validatorVotes)
    .where(and(eq(validatorVotes.marketId, marketId), eq(validatorVotes.vote, finalOutcome), eq(validatorVotes.rewarded, false)));

  for (const v of correctVoters) {
    const reward = 2; // flat reward
    await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${reward}`, reputation: sql`${users.reputation} + 5` })
      .where(eq(users.id, v.userId));

    await db.update(validatorVotes).set({ rewarded: true }).where(eq(validatorVotes.id, v.id));

    await db.insert(transactions).values({
      userId: v.userId,
      type: "reward",
      amount: String(reward),
      description: `Validator reward for market #${marketId}`,
      marketId,
    });
  }

  return Response.json({ success: true, outcome: finalOutcome, consensus: consensusOutcome });
}
