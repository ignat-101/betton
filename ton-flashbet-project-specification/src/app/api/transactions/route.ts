import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telegramId = searchParams.get("telegramId");
  const limitParam = parseInt(searchParams.get("limit") ?? "30");

  if (!telegramId) return Response.json({ error: "Missing telegramId" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  if (!user) return Response.json([]);

  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.createdAt))
    .limit(limitParam);

  return Response.json(txs);
}
