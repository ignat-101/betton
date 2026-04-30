import { db } from "@/db";
import { users, referrals, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

// GET /api/users?telegramId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telegramId = searchParams.get("telegramId");
  if (!telegramId) return Response.json({ error: "Missing telegramId" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(user);
}

// POST /api/users — upsert user
export async function POST(req: Request) {
  const body = await req.json();
  const { telegramId, username, displayName, avatarUrl, tonAddress, referralCode } = body;

  if (!telegramId) return Response.json({ error: "Missing telegramId" }, { status: 400 });

  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(users)
      .set({
        username: username ?? existing[0].username,
        displayName: displayName ?? existing[0].displayName,
        avatarUrl: avatarUrl ?? existing[0].avatarUrl,
        tonAddress: tonAddress ?? existing[0].tonAddress,
      })
      .where(eq(users.telegramId, telegramId))
      .returning();
    return Response.json(updated);
  }

  const myCode = nanoid(8).toUpperCase();

  let referrerId: number | undefined;
  if (referralCode) {
    const [referrer] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, referralCode))
      .limit(1);
    if (referrer) referrerId = referrer.id;
  }

  const [created] = await db
    .insert(users)
    .values({
      telegramId,
      username,
      displayName,
      avatarUrl,
      tonAddress,
      referralCode: myCode,
      referredBy: referrerId,
      balance: "10",
    })
    .returning();

  if (referrerId) {
    await db.insert(referrals).values({
      referrerId,
      refereeId: created.id,
    });
    await db
      .update(users)
      .set({ balance: sql`${users.balance} + 5` })
      .where(eq(users.id, referrerId));
    await db.insert(transactions).values({
      userId: referrerId,
      type: "referral",
      amount: "5",
      description: `Referral bonus for inviting ${displayName || username || telegramId}`,
    });
  }

  return Response.json(created, { status: 201 });
}

// PATCH /api/users — update TON address
export async function PATCH(req: Request) {
  const body = await req.json();
  const { telegramId, tonAddress } = body;
  if (!telegramId) return Response.json({ error: "Missing telegramId" }, { status: 400 });

  const [updated] = await db
    .update(users)
    .set({ tonAddress })
    .where(eq(users.telegramId, telegramId))
    .returning();

  return Response.json(updated);
}
