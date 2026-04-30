import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

// POST /api/admin/seed — create default admin user (first time setup)
export async function POST(req: Request) {
  const body = await req.json();
  const { telegramId, secret } = body;

  // Simple setup secret
  if (secret !== (process.env.ADMIN_SECRET ?? "flashbet-admin-2024")) {
    return Response.json({ error: "Invalid secret" }, { status: 403 });
  }

  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.telegramId, telegramId))
      .returning();
    return Response.json(updated);
  }

  const [created] = await db
    .insert(users)
    .values({
      telegramId,
      username: "admin",
      displayName: "Admin",
      referralCode: nanoid(8).toUpperCase(),
      isAdmin: true,
      balance: "1000",
    })
    .returning();

  return Response.json(created, { status: 201 });
}
