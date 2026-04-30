"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "./App";

type Market = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  yesPool: string;
  noPool: string;
  resolvedOutcome: string | null;
  oracleType: string | null;
  oracleTicker: string | null;
  oracleCondition: string | null;
  closesAt: string | null;
  createdAt: string;
  creatorUsername: string | null;
  creatorDisplay: string | null;
};

type Stats = {
  users: number;
  markets: number;
  bets: number;
  pendingMarkets: number;
  activeMarkets: number;
  totalVolume: number;
};

export default function AdminTab({
  user,
  showToast,
  refreshUser,
}: {
  user: User;
  showToast: (m: string) => void;
  refreshUser: (id: string) => Promise<User | null>;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filter, setFilter] = useState<"pending" | "active" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [actionMarket, setActionMarket] = useState<Market | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveOutcome, setResolveOutcome] = useState<"yes" | "no">("yes");
  const [useOracle, setUseOracle] = useState(false);
  const [acting, setActing] = useState(false);
  const [view, setView] = useState<"stats" | "markets">("markets");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, mRes] = await Promise.all([
        fetch(`/api/admin/stats?telegramId=${user.telegramId}`),
        fetch(`/api/markets?status=${filter === "all" ? "" : filter}&limit=50`),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (mRes.ok) {
        const data = await mRes.json();
        setMarkets(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user.telegramId, filter]);

  useEffect(() => { load(); }, [load]);

  async function approve(market: Market, action: "approve" | "reject") {
    setActing(true);
    try {
      const res = await fetch(`/api/markets/${market.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: user.telegramId, action }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed");
      showToast(`✅ Market ${action === "approve" ? "approved" : "rejected"}`);
      load();
    } finally {
      setActing(false);
    }
  }

  async function resolve() {
    if (!actionMarket) return;
    setActing(true);
    try {
      const res = await fetch(`/api/markets/${actionMarket.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: user.telegramId,
          outcome: resolveOutcome,
          resolverNote: resolveNote,
          useOracle,
        }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed");
      showToast(`✅ Resolved: ${data.outcome?.toUpperCase()}`);
      setActionMarket(null);
      setResolveNote("");
      load();
    } finally {
      setActing(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Admin</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>Market management</div>
        </div>
        <span className="badge badge-active">Admin</span>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {/* Stats cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12, marginBottom: 16 }}>
            {[
              { label: "Users", value: stats.users },
              { label: "Pending", value: stats.pendingMarkets, warn: stats.pendingMarkets > 0 },
              { label: "Active", value: stats.activeMarkets },
              { label: "Markets", value: stats.markets },
              { label: "Bets", value: stats.bets },
              { label: "Volume", value: stats.totalVolume.toFixed(0) },
            ].map((s) => (
              <div
                key={s.label}
                className="glass-sm"
                style={{ padding: "12px", textAlign: "center" }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: s.warn ? "var(--no)" : "var(--text)",
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="filter-tabs" style={{ padding: 0, marginBottom: 12 }}>
          {(["pending", "active", "all"] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && stats?.pendingMarkets ? ` (${stats.pendingMarkets})` : ""}
            </button>
          ))}
        </div>

        {/* Market list */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12, marginBottom: 8 }} />
          ))
        ) : markets.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text3)", padding: "40px 0", fontSize: 13 }}>
            No markets
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {markets.map((m) => (
              <div key={m.id} className="glass-sm" style={{ padding: 14 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className="cat-pill" style={{ fontSize: 10 }}>{m.category}</span>
                      <span className={`badge badge-${m.status}`}>{m.status}</span>
                      {m.oracleType && <span className="cat-pill" style={{ fontSize: 10 }}>🔮 Oracle</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                      by @{m.creatorDisplay || m.creatorUsername || "?"} · {new Date(m.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  {m.status === "pending" && (
                    <>
                      <button
                        className="btn-yes"
                        style={{ flex: 1, fontSize: 12, padding: "6px 12px" }}
                        disabled={acting}
                        onClick={() => approve(m, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-no"
                        style={{ flex: 1, fontSize: 12, padding: "6px 12px" }}
                        disabled={acting}
                        onClick={() => approve(m, "reject")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {(m.status === "active" || m.status === "closed") && (
                    <button
                      className="btn-primary"
                      style={{ padding: "8px 16px", fontSize: 12 }}
                      onClick={() => { setActionMarket(m); setUseOracle(!!m.oracleType); }}
                    >
                      Resolve
                    </button>
                  )}
                  {m.status === "resolved" && (
                    <span style={{ fontSize: 12, color: m.resolvedOutcome === "yes" ? "var(--yes)" : "var(--no)", fontWeight: 600 }}>
                      Resolved: {m.resolvedOutcome?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {actionMarket && (
        <div className="modal-overlay" onClick={() => setActionMarket(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Resolve Market</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.4 }}>
              {actionMarket.title}
            </div>

            {/* Oracle option */}
            {actionMarket.oracleType === "coingecko" && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--bg3)",
                  borderRadius: 10,
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => setUseOracle(!useOracle)}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>🔮 Use Oracle</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>
                    {actionMarket.oracleTicker?.toUpperCase()} — {actionMarket.oracleCondition}
                  </div>
                </div>
                <div style={{ color: useOracle ? "var(--yes)" : "var(--text3)", fontWeight: 700 }}>
                  {useOracle ? "ON" : "OFF"}
                </div>
              </div>
            )}

            {!useOracle && (
              <>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>Outcome</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button
                    className={`btn-yes ${resolveOutcome === "yes" ? "active" : ""}`}
                    style={{ flex: 1 }}
                    onClick={() => setResolveOutcome("yes")}
                  >
                    YES
                  </button>
                  <button
                    className={`btn-no ${resolveOutcome === "no" ? "active" : ""}`}
                    style={{ flex: 1 }}
                    onClick={() => setResolveOutcome("no")}
                  >
                    NO
                  </button>
                </div>
              </>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6 }}>
                Resolution note (optional)
              </label>
              <input
                className="input"
                placeholder="e.g. Price reached $100k on Dec 1"
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setActionMarket(null)}>
                Cancel
              </button>
              <button className="btn-primary" style={{ flex: 2 }} disabled={acting} onClick={resolve}>
                {acting ? "Resolving..." : "Resolve Market"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
