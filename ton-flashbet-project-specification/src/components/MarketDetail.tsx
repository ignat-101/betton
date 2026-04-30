"use client";

import { useState, useEffect } from "react";
import type { User } from "./App";

type MarketFull = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  yesPool: string;
  noPool: string;
  resolvedOutcome: string | null;
  resolverNote: string | null;
  oracleType: string | null;
  oracleTicker: string | null;
  oracleCondition: string | null;
  closesAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  creatorDisplay: string | null;
  creatorUsername: string | null;
  betStats: { totalBets: number; yesBets: number; noBets: number };
  voteStats: { yesVotes: number; noVotes: number };
};

type BetEntry = {
  id: number;
  side: string;
  amount: string;
  createdAt: string;
  username: string | null;
  displayName: string | null;
};

function calcProb(yes: string, no: string) {
  const y = parseFloat(yes) || 0;
  const n = parseFloat(no) || 0;
  const t = y + n;
  if (t === 0) return { yes: 50, no: 50, yesNum: y, noNum: n, total: 0 };
  return { yes: Math.round((y / t) * 100), no: Math.round((n / t) * 100), yesNum: y, noNum: n, total: t };
}

export default function MarketDetail({
  marketId,
  user,
  showToast,
  refreshUser,
  onBack,
}: {
  marketId: number;
  user: User;
  showToast: (m: string) => void;
  refreshUser: (id: string) => Promise<User | null>;
  onBack: () => void;
}) {
  const [market, setMarket] = useState<MarketFull | null>(null);
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const [voting, setVoting] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [showBetModal, setShowBetModal] = useState(false);

  async function load() {
    try {
      const [mRes, bRes, vRes] = await Promise.all([
        fetch(`/api/markets/${marketId}`),
        fetch(`/api/bets?marketId=${marketId}`),
        fetch(`/api/votes?marketId=${marketId}&telegramId=${user.telegramId}`),
      ]);
      if (mRes.ok) setMarket(await mRes.json());
      if (bRes.ok) setBets(await bRes.json());
      if (vRes.ok) {
        const vData = await vRes.json();
        setMyVote(vData.myVote?.vote ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [marketId]);

  async function placeBet() {
    if (!amount || parseFloat(amount) <= 0) return showToast("Enter a valid amount");
    if (parseFloat(amount) > parseFloat(user.balance)) return showToast("Insufficient balance");
    setPlacing(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user.telegramId, marketId, side, amount }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed to place bet");
      showToast(`✅ Bet placed: ${side.toUpperCase()} ${amount} TFB`);
      setAmount("");
      setShowBetModal(false);
      await Promise.all([load(), refreshUser(user.telegramId)]);
    } finally {
      setPlacing(false);
    }
  }

  async function castVote(v: "yes" | "no") {
    if (myVote) return showToast("Already voted");
    setVoting(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user.telegramId, marketId, vote: v }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Vote failed");
      setMyVote(v);
      showToast(`✅ Voted ${v.toUpperCase()}`);
      load();
    } finally {
      setVoting(false);
    }
  }

  if (loading || !market) {
    return (
      <div>
        <div className="topbar">
          <button className="btn-ghost" onClick={onBack} style={{ padding: "6px 12px" }}>← Back</button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  const prob = calcProb(market.yesPool, market.noPool);
  const canBet = market.status === "active";
  const canVote = (market.status === "active" || market.status === "closed") && !myVote;

  const estimatedShares = amount && parseFloat(amount) > 0
    ? (parseFloat(amount) / ((side === "yes" ? prob.yes : prob.no) / 100 || 0.5)).toFixed(2)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="topbar">
        <button className="btn-ghost" onClick={onBack} style={{ padding: "6px 12px", fontSize: 13 }}>
          ← Back
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <span className={`badge badge-${market.status}`}>{market.status}</span>
          {market.oracleType && <span className="badge" style={{ background: "rgba(108,99,255,0.15)", color: "var(--accent)" }}>🔮</span>}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* Title */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span className="cat-pill">{market.category}</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
          {market.title}
        </h2>
        {market.description && (
          <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
            {market.description}
          </p>
        )}

        {/* Oracle info */}
        {market.oracleType === "coingecko" && (
          <div className="glass-sm" style={{ padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
            <span>🔮</span>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>
              Oracle: {market.oracleTicker?.toUpperCase()} — condition: <code style={{ color: "var(--accent)" }}>{market.oracleCondition}</code>
            </span>
          </div>
        )}

        {/* Big probability display */}
        {(market.status === "active" || market.status === "closed") && (
          <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--yes)" }}>{prob.yes}%</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Yes</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--no)" }}>{prob.no}%</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>No</div>
              </div>
            </div>
            <div className="prob-bar" style={{ height: 6 }}>
              <div className="prob-bar-fill" style={{ width: `${prob.yes}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: "var(--text3)", fontSize: 11 }}>
              <span>Vol: {prob.total.toFixed(0)} TFB</span>
              <span>{market.betStats?.totalBets ?? 0} bets</span>
              {market.closesAt && (
                <span>{new Date(market.closesAt) > new Date() ? `Closes ${new Date(market.closesAt).toLocaleDateString()}` : "Closed"}</span>
              )}
            </div>
          </div>
        )}

        {/* Resolved outcome */}
        {market.status === "resolved" && (
          <div
            className="glass"
            style={{
              padding: 20,
              marginBottom: 16,
              textAlign: "center",
              borderColor: market.resolvedOutcome === "yes" ? "rgba(63,182,139,0.3)" : "rgba(239,83,80,0.3)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Resolved outcome</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: market.resolvedOutcome === "yes" ? "var(--yes)" : "var(--no)" }}>
              {market.resolvedOutcome?.toUpperCase()}
            </div>
            {market.resolverNote && (
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>{market.resolverNote}</div>
            )}
          </div>
        )}

        {/* Buy/Bet buttons */}
        {canBet && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className="btn-yes" style={{ flex: 1 }} onClick={() => { setSide("yes"); setShowBetModal(true); }}>
              Buy Yes · {prob.yes}¢
            </button>
            <button className="btn-no" style={{ flex: 1 }} onClick={() => { setSide("no"); setShowBetModal(true); }}>
              Buy No · {prob.no}¢
            </button>
          </div>
        )}

        {/* Validator Voting */}
        {canVote && (
          <div className="glass-sm" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Validator Vote</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
              Vote on the outcome. Correct validators earn rewards.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["yes", "no"] as const).map((v) => (
                <button
                  key={v}
                  disabled={voting}
                  className={v === "yes" ? "btn-yes" : "btn-no"}
                  style={{ flex: 1 }}
                  onClick={() => castVote(v)}
                >
                  Vote {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {myVote && (
          <div className="glass-sm" style={{ padding: 12, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
            <span>✅</span>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>
              You voted <strong style={{ color: myVote === "yes" ? "var(--yes)" : "var(--no)" }}>{myVote.toUpperCase()}</strong>
            </span>
          </div>
        )}

        {/* Vote stats */}
        {market.voteStats && ((market.voteStats.yesVotes ?? 0) + (market.voteStats.noVotes ?? 0)) > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>Validator consensus</div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ color: "var(--yes)", fontSize: 13 }}>✓ {market.voteStats.yesVotes ?? 0} Yes</span>
              <span style={{ color: "var(--no)", fontSize: 13 }}>✗ {market.voteStats.noVotes ?? 0} No</span>
            </div>
          </div>
        )}

        {/* Recent bets */}
        {bets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Recent activity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {bets.slice(0, 8).map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                      {(b.displayName || b.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>
                      @{b.displayName || b.username || "anon"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: b.side === "yes" ? "var(--yes)" : "var(--no)",
                      }}
                    >
                      {b.side.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text)" }}>
                      {parseFloat(b.amount).toFixed(2)} TFB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creator */}
        <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 16 }}>
          Created by @{market.creatorDisplay || market.creatorUsername || "unknown"} · {new Date(market.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Bet Modal */}
      {showBetModal && (
        <div className="modal-overlay" onClick={() => setShowBetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Place Bet</div>
              <button className="btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setShowBetModal(false)}>✕</button>
            </div>

            {/* Side selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                className={`btn-yes ${side === "yes" ? "active" : ""}`}
                style={{ flex: 1 }}
                onClick={() => setSide("yes")}
              >
                Yes · {prob.yes}%
              </button>
              <button
                className={`btn-no ${side === "no" ? "active" : ""}`}
                style={{ flex: 1 }}
                onClick={() => setSide("no")}
              >
                No · {prob.no}%
              </button>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6 }}>
                Amount (TFB)
              </label>
              <input
                className="input"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>

            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {["1", "5", "10", "25"].map((v) => (
                <button key={v} className="btn-ghost" style={{ flex: 1, padding: "6px" }} onClick={() => setAmount(v)}>
                  {v}
                </button>
              ))}
            </div>

            {/* Balance & estimate */}
            <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text2)" }}>Balance</span>
                <span>{parseFloat(user.balance).toFixed(2)} TFB</span>
              </div>
              {estimatedShares && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text2)" }}>Est. shares</span>
                  <span style={{ color: side === "yes" ? "var(--yes)" : "var(--no)" }}>{estimatedShares}</span>
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              disabled={placing || !amount || parseFloat(amount) <= 0}
              onClick={placeBet}
            >
              {placing ? "Placing..." : `Buy ${side.toUpperCase()} for ${amount || "0"} TFB`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
