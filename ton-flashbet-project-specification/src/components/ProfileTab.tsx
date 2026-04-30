"use client";

import { useState, useEffect } from "react";
import type { User } from "./App";

const ADMIN_TON = "UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0";

type Tx = {
  id: number;
  type: string;
  amount: string;
  description: string | null;
  createdAt: string;
};

type BetEntry = {
  id: number;
  marketId: number;
  side: string;
  amount: string;
  paid: boolean;
  payout: string | null;
  marketTitle: string | null;
  marketStatus: string | null;
  marketOutcome: string | null;
  createdAt: string;
};

function txIcon(type: string) {
  switch (type) {
    case "bet": return "🎯";
    case "payout": return "💰";
    case "reward": return "⭐";
    case "referral": return "👥";
    case "deposit": return "📥";
    default: return "•";
  }
}

export default function ProfileTab({
  user,
  showToast,
  refreshUser,
}: {
  user: User;
  showToast: (m: string) => void;
  refreshUser: (id: string) => Promise<User | null>;
}) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [tab, setTab] = useState<"bets" | "txs">("bets");
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/transactions?telegramId=${user.telegramId}`).then(r => r.json()),
      fetch(`/api/bets?telegramId=${user.telegramId}`).then(r => r.json()),
    ]).then(([t, b]) => {
      if (Array.isArray(t)) setTxs(t);
      if (Array.isArray(b)) setBets(b);
    }).catch(() => {});
  }, [user.telegramId]);

  function copyRef() {
    if (!user.referralCode) return;
    const link = `https://t.me/TONFlashBetBot?start=${user.referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopying(true);
      showToast("✅ Referral link copied!");
      setTimeout(() => setCopying(false), 2000);
    }).catch(() => showToast("Copy failed"));
  }

  function copyAddress() {
    navigator.clipboard.writeText(ADMIN_TON).then(() => {
      showToast("✅ Address copied!");
    }).catch(() => {});
  }

  const totalBets = bets.length;
  const wonBets = bets.filter(b => b.paid && b.payout).length;
  const totalWagered = bets.reduce((s, b) => s + parseFloat(b.amount), 0);

  return (
    <div>
      <div className="topbar">
        <div style={{ fontSize: 16, fontWeight: 700 }}>Profile</div>
        <div className="avatar" style={{ width: 34, height: 34, fontSize: 14 }}>
          {(user.displayName || user.username || "?").charAt(0).toUpperCase()}
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* User card */}
        <div className="glass" style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
              {(user.displayName || user.username || "?").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {user.displayName || user.username || user.telegramId}
              </div>
              {user.username && (
                <div style={{ fontSize: 12, color: "var(--text2)" }}>@{user.username}</div>
              )}
              {user.isAdmin && (
                <span className="badge badge-active" style={{ marginTop: 4 }}>Admin</span>
              )}
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Balance</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {parseFloat(user.balance).toFixed(2)}
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", marginLeft: 4 }}>TFB</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Reputation</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {user.reputation}
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", marginLeft: 4 }}>pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="glass-sm" style={{ padding: "4px 0" }}>
          <div className="stat-row" style={{ padding: "10px 16px" }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>Total bets</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{totalBets}</span>
          </div>
          <div className="stat-row" style={{ padding: "10px 16px" }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>Wins</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--yes)" }}>{wonBets}</span>
          </div>
          <div className="stat-row" style={{ padding: "10px 16px" }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>Total wagered</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{totalWagered.toFixed(2)} TFB</span>
          </div>
        </div>

        {/* Deposit section */}
        <div className="glass-sm" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>💎 Deposit via TON</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, lineHeight: 1.5 }}>
            Send TON to the address below and contact admin for TFB credit.
          </div>
          <div
            style={{
              background: "var(--bg3)",
              borderRadius: 8,
              padding: "8px 12px",
              fontFamily: "monospace",
              fontSize: 11,
              color: "var(--text)",
              wordBreak: "break-all",
              marginBottom: 8,
            }}
          >
            {ADMIN_TON}
          </div>
          <button className="btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={copyAddress}>
            Copy Address
          </button>
        </div>

        {/* Referral */}
        {user.referralCode && (
          <div className="glass-sm" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>👥 Referral</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
              Invite friends and earn 5 TFB per signup
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "var(--bg3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontFamily: "monospace" }}>
                {user.referralCode}
              </div>
              <button className="btn-primary" style={{ width: "auto", padding: "8px 16px" }} onClick={copyRef}>
                {copying ? "✓" : "Share"}
              </button>
            </div>
          </div>
        )}

        {/* Bets / Txs tabs */}
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              className={`filter-tab ${tab === "bets" ? "active" : ""}`}
              onClick={() => setTab("bets")}
            >
              My Bets
            </button>
            <button
              className={`filter-tab ${tab === "txs" ? "active" : ""}`}
              onClick={() => setTab("txs")}
            >
              Transactions
            </button>
          </div>

          {tab === "bets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {bets.length === 0 ? (
                <div style={{ color: "var(--text3)", textAlign: "center", padding: "24px 0", fontSize: 13 }}>
                  No bets yet
                </div>
              ) : (
                bets.map((b) => {
                  const won = b.paid && b.payout && b.marketOutcome === b.side;
                  const lost = b.marketStatus === "resolved" && b.marketOutcome !== b.side;
                  return (
                    <div
                      key={b.id}
                      className="glass-sm"
                      style={{ padding: "12px 14px" }}
                    >
                      <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 6, lineHeight: 1.3 }}>
                        {b.marketTitle || `Market #${b.marketId}`}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: b.side === "yes" ? "var(--yes)" : "var(--no)",
                            }}
                          >
                            {b.side.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text2)" }}>
                            {parseFloat(b.amount).toFixed(2)} TFB
                          </span>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          {won ? (
                            <span style={{ color: "var(--yes)" }}>+{parseFloat(b.payout!).toFixed(2)} TFB</span>
                          ) : lost ? (
                            <span style={{ color: "var(--no)" }}>Lost</span>
                          ) : b.marketStatus === "active" ? (
                            <span className="badge badge-active">Live</span>
                          ) : (
                            <span style={{ color: "var(--text3)" }}>{b.marketStatus}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "txs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {txs.length === 0 ? (
                <div style={{ color: "var(--text3)", textAlign: "center", padding: "24px 0", fontSize: 13 }}>
                  No transactions yet
                </div>
              ) : (
                txs.map((tx) => (
                  <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>{txIcon(tx.type)}</span>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--text)" }}>
                          {tx.description || tx.type}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: parseFloat(tx.amount) >= 0 ? "var(--yes)" : "var(--no)",
                      }}
                    >
                      {parseFloat(tx.amount) >= 0 ? "+" : ""}
                      {parseFloat(tx.amount).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
