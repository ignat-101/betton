import { db } from "@/db";
import { markets, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// POST /api/markets/[id]/approve — admin approves or rejects a market
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const marketId = parseInt(id);

  const body = await req.json();
  const { telegramId, action } = body; // action: "approve" | "reject"

  if (!telegramId) return Response.json({ error: "Missing telegramId" }, { status: 400 });

  // Check admin
  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  if (!user || !user.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const newStatus = action === "approve" ? "active" : "cancelled";

  const [updated] = await db
    .update(markets)
    .set({ status: newStatus, resolverId: user.id })
    .where(eq(markets.id, marketId))
    .returning();

  return Response.json(updated);
}
