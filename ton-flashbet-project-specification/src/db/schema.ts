import {
  pgTable,
  serial,
  text,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const marketStatusEnum = pgEnum("market_status", [
  "pending",
  "active",
  "closed",
  "resolved",
  "cancelled",
]);

export const betSideEnum = pgEnum("bet_side", ["yes", "no"]);

export const voteEnum = pgEnum("vote_type", ["yes", "no"]);

// Users (identified by Telegram ID)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: varchar("telegram_id", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 128 }),
  displayName: varchar("display_name", { length: 256 }),
  avatarUrl: text("avatar_url"),
  tonAddress: varchar("ton_address", { length: 128 }),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  reputation: integer("reputation").notNull().default(100),
  referralCode: varchar("referral_code", { length: 32 }).unique(),
  referredBy: integer("referred_by"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Markets (prediction events created by users)
export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull().default("other"),
  imageUrl: text("image_url"),
  status: marketStatusEnum("status").notNull().default("pending"),
  resolvedOutcome: betSideEnum("resolved_outcome"),
  resolverNote: text("resolver_note"),
  resolverId: integer("resolver_id").references(() => users.id),
  // Liquidity pools
  yesPool: numeric("yes_pool", { precision: 18, scale: 2 }).notNull().default("0"),
  noPool: numeric("no_pool", { precision: 18, scale: 2 }).notNull().default("0"),
  // Price oracle integration
  oracleType: varchar("oracle_type", { length: 32 }), // "coingecko" | "manual"
  oracleTicker: varchar("oracle_ticker", { length: 32 }), // e.g. "bitcoin"
  oracleCondition: text("oracle_condition"), // e.g. "price > 100000"
  // Timing
  closesAt: timestamp("closes_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bets placed by users on markets
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => markets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  side: betSideEnum("side").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  shares: numeric("shares", { precision: 18, scale: 6 }).notNull(),
  // Stars payment
  starsAmount: integer("stars_amount"),
  starsPaymentId: varchar("stars_payment_id", { length: 256 }),
  // Payout
  paid: boolean("paid").notNull().default(false),
  payout: numeric("payout", { precision: 18, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Validator votes (PoS-style consensus for market resolution)
export const validatorVotes = pgTable("validator_votes", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => markets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  vote: voteEnum("vote").notNull(),
  stake: numeric("stake", { precision: 18, scale: 2 }).notNull().default("0"),
  rewarded: boolean("rewarded").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions log
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 32 }).notNull(), // "bet" | "payout" | "reward" | "referral" | "deposit"
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  description: text("description"),
  marketId: integer("market_id").references(() => markets.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Referrals
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  refereeId: integer("referee_id").notNull().references(() => users.id),
  bonusPaid: boolean("bonus_paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
