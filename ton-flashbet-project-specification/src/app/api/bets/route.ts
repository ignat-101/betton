import { db } from "@/db";
import { bets, markets, users, transactions } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/bets?telegramId=xxx&marketId=yyy
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telegramId = searchParams.get("telegramId");
  const marketId = searchParams.get("marketId");

  if (telegramId) {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return Response.json([]);

    const userBets = await db
      .select({
        id: bets.id,
        marketId: bets.marketId,
        side: bets.side,
        amount: bets.amount,
        shares: bets.shares,
        paid: bets.paid,
        payout: bets.payout,
        createdAt: bets.createdAt,
        marketTitle: markets.title,
        marketStatus: markets.status,
        marketOutcome: markets.resolvedOutcome,
      })
      .from(bets)
      .leftJoin(markets, eq(bets.marketId, markets.id))
      .where(eq(bets.userId, user.id))
      .orderBy(desc(bets.createdAt))
      .limit(50);

    return Response.json(userBets);
  }

  if (marketId) {
    const mid = parseInt(marketId);
    const marketBets = await db
      .select({
        id: bets.id,
        side: bets.side,
        amount: bets.amount,
        shares: bets.shares,
        createdAt: bets.createdAt,
        username: users.username,
        displayName: users.displayName,
      })
      .from(bets)
      .leftJoin(users, eq(bets.userId, users.id))
      .where(eq(bets.marketId, mid))
      .orderBy(desc(bets.createdAt))
      .limit(50);

    return Response.json(marketBets);
  }

  return Response.json({ error: "Provide telegramId or marketId" }, { status: 400 });
}

// POST /api/bets — place a bet
export async function POST(req: Request) {
  const body = await req.json();
  const { telegramId, marketId, side, amount } = body;

  if (!telegramId || !marketId || !side || !amount) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const betAmount = parseFloat(amount);
  if (betAmount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const userBalance = parseFloat(user.balance);
  if (userBalance < betAmount) {
    return Response.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const [market] = await db.select().from(markets).where(eq(markets.id, parseInt(marketId))).limit(1);
  if (!market) return Response.json({ error: "Market not found" }, { status: 404 });
  if (market.status !== "active") {
    return Response.json({ error: "Market is not active" }, { status: 400 });
  }

  const yesPool = parseFloat(market.yesPool);
  const noPool = parseFloat(market.noPool);

  // Calculate shares (AMM)
  const sidePool = side === "yes" ? yesPool : noPool;
  const totalPool = yesPool + noPool;
  const price = totalPool > 0 ? (sidePool + betAmount) / (totalPool + betAmount) : 0.5;
  const shares = betAmount / (price > 0 ? price : 0.5);

  // Deduct balance
  await db
    .update(users)
    .set({ balance: sql`${users.balance} - ${betAmount}` })
    .where(eq(users.id, user.id));

  // Update pool
  if (side === "yes") {
    await db
      .update(markets)
      .set({ yesPool: sql`${markets.yesPool} + ${betAmount}` })
      .where(eq(markets.id, market.id));
  } else {
    await db
      .update(markets)
      .set({ noPool: sql`${markets.noPool} + ${betAmount}` })
      .where(eq(markets.id, market.id));
  }

  // Insert bet
  const [bet] = await db
    .insert(bets)
    .values({
      marketId: market.id,
      userId: user.id,
      side,
      amount: String(betAmount),
      shares: String(shares),
    })
    .returning();

  // Log transaction
  await db.insert(transactions).values({
    userId: user.id,
    type: "bet",
    amount: String(-betAmount),
    description: `Bet ${side.toUpperCase()} on market #${market.id}`,
    marketId: market.id,
  });

  return Response.json(bet, { status: 201 });
}
