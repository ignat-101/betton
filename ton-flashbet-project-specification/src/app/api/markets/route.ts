import { db } from "@/db";
import { markets, users, bets } from "@/db/schema";
import { eq, desc, sql, and, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/markets?status=active&category=crypto&limit=20&offset=0
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const limitParam = parseInt(searchParams.get("limit") ?? "20");
  const offsetParam = parseInt(searchParams.get("offset") ?? "0");

  const conditions = [];
  if (status) conditions.push(eq(markets.status, status as "pending" | "active" | "closed" | "resolved" | "cancelled"));
  if (category && category !== "all") conditions.push(eq(markets.category, category));

  const rows = await db
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
      oracleType: markets.oracleType,
      oracleTicker: markets.oracleTicker,
      oracleCondition: markets.oracleCondition,
      closesAt: markets.closesAt,
      createdAt: markets.createdAt,
      creatorUsername: users.username,
      creatorDisplay: users.displayName,
    })
    .from(markets)
    .leftJoin(users, eq(markets.creatorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(markets.createdAt))
    .limit(limitParam)
    .offset(offsetParam);

  return Response.json(rows);
}

// POST /api/markets — create new market (by any user, goes to pending)
export async function POST(req: Request) {
  const body = await req.json();
  const {
    telegramId,
    title,
    description,
    category,
    imageUrl,
    oracleType,
    oracleTicker,
    oracleCondition,
    closesAt,
  } = body;

  if (!telegramId || !title) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const [market] = await db
    .insert(markets)
    .values({
      creatorId: user.id,
      title,
      description,
      category: category ?? "other",
      imageUrl,
      oracleType,
      oracleTicker,
      oracleCondition,
      closesAt: closesAt ? new Date(closesAt) : undefined,
      status: "pending",
    })
    .returning();

  return Response.json(market, { status: 201 });
}
