import { db } from "@/db";
import { validatorVotes, users, markets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/votes?marketId=xxx&telegramId=yyy
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get("marketId");
  const telegramId = searchParams.get("telegramId");

  if (!marketId) return Response.json({ error: "Missing marketId" }, { status: 400 });
  const mid = parseInt(marketId);

  const allVotes = await db
    .select({
      id: validatorVotes.id,
      vote: validatorVotes.vote,
      stake: validatorVotes.stake,
      createdAt: validatorVotes.createdAt,
      username: users.username,
      displayName: users.displayName,
    })
    .from(validatorVotes)
    .leftJoin(users, eq(validatorVotes.userId, users.id))
    .where(eq(validatorVotes.marketId, mid));

  // If telegramId provided, check if user already voted
  if (telegramId) {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (user) {
      const [myVote] = await db
        .select()
        .from(validatorVotes)
        .where(and(eq(validatorVotes.marketId, mid), eq(validatorVotes.userId, user.id)))
        .limit(1);
      return Response.json({ votes: allVotes, myVote: myVote ?? null });
    }
  }

  return Response.json({ votes: allVotes, myVote: null });
}

// POST /api/votes — cast validator vote
export async function POST(req: Request) {
  const body = await req.json();
  const { telegramId, marketId, vote, stake } = body;

  if (!telegramId || !marketId || !vote) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const [market] = await db.select().from(markets).where(eq(markets.id, parseInt(marketId))).limit(1);
  if (!market) return Response.json({ error: "Market not found" }, { status: 404 });
  if (market.status !== "closed" && market.status !== "active") {
    return Response.json({ error: "Voting only allowed on closed/active markets" }, { status: 400 });
  }

  // Check if already voted
  const [existing] = await db
    .select()
    .from(validatorVotes)
    .where(and(eq(validatorVotes.marketId, market.id), eq(validatorVotes.userId, user.id)))
    .limit(1);

  if (existing) {
    return Response.json({ error: "Already voted" }, { status: 409 });
  }

  const stakeAmount = stake ? parseFloat(stake) : 0;

  const [newVote] = await db
    .insert(validatorVotes)
    .values({
      marketId: market.id,
      userId: user.id,
      vote,
      stake: String(stakeAmount),
    })
    .returning();

  return Response.json(newVote, { status: 201 });
}
