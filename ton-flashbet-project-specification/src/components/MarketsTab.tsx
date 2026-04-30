"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "./App";
import MarketDetail from "./MarketDetail";

type Market = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  yesPool: string;
  noPool: string;
  resolvedOutcome: string | null;
  closesAt: string | null;
  createdAt: string;
  creatorUsername: string | null;
  creatorDisplay: string | null;
  oracleType: string | null;
  oracleTicker: string | null;
};

const CATEGORIES = ["all", "crypto", "sports", "politics", "weather", "other"];

function calcProb(yes: string, no: string) {
  const y = parseFloat(yes) || 0;
  const n = parseFloat(no) || 0;
  const t = y + n;
  if (t === 0) return { yes: 50, no: 50 };
  return { yes: Math.round((y / t) * 100), no: Math.round((n / t) * 100) };
}

function formatVolume(yes: string, no: string) {
  const t = (parseFloat(yes) || 0) + (parseFloat(no) || 0);
  if (t >= 1000) return `${(t / 1000).toFixed(1)}k`;
  return t.toFixed(0);
}

function timeLeft(closesAt: string | null): string {
  if (!closesAt) return "";
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor(diff / 60000);
  return `${mins}m left`;
}

export default function MarketsTab({
  user,
  showToast,
  refreshUser,
}: {
  user: User;
  showToast: (m: string) => void;
  refreshUser: (id: string) => Promise<User | null>;
}) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("active");
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (status !== "all") params.set("status", status);
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/markets?${params}`);
      if (res.ok) setMarkets(await res.json());
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => { load(); }, [load]);

  if (selected !== null) {
    return (
      <MarketDetail
        marketId={selected}
        user={user}
        showToast={showToast}
        refreshUser={refreshUser}
        onBack={() => { setSelected(null); load(); }}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="topbar">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Markets</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>Predict anything</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>
            ⚡ {parseFloat(user.balance).toFixed(2)} TFB
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="filter-tabs" style={{ paddingTop: 12 }}>
        {["active", "resolved", "pending", "all"].map((s) => (
          <button
            key={s}
            className={`filter-tab ${status === s ? "active" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="filter-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`filter-tab ${category === c ? "active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Market list */}
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))
        ) : markets.length === 0 ? (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              color: "var(--text3)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14 }}>No markets found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Be the first to create one</div>
          </div>
        ) : (
          markets.map((m) => {
            const prob = calcProb(m.yesPool, m.noPool);
            const vol = formatVolume(m.yesPool, m.noPool);
            const tl = timeLeft(m.closesAt);

            return (
              <div key={m.id} className="market-card fade-in" onClick={() => setSelected(m.id)}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                      <span className="cat-pill">{m.category}</span>
                      {m.oracleType && <span className="cat-pill">🔮 Oracle</span>}
                      <span className={`badge badge-${m.status}`}>{m.status}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: "var(--text)" }}>
                      {m.title}
                    </div>
                  </div>
                </div>

                {/* Probability bar */}
                {m.status === "active" || m.status === "closed" ? (
                  <>
                    <div className="prob-bar" style={{ marginBottom: 8 }}>
                      <div
                        className="prob-bar-fill"
                        style={{ width: `${prob.yes}%` }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--yes)" }}>
                          {prob.yes}% Yes
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--no)" }}>
                          {prob.no}% No
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 12, color: "var(--text3)", fontSize: 11 }}>
                        <span>Vol {vol}</span>
                        {tl && <span>{tl}</span>}
                      </div>
                    </div>
                  </>
                ) : m.status === "resolved" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.resolvedOutcome === "yes" ? "var(--yes)" : "var(--no)" }}>
                      Resolved: {m.resolvedOutcome?.toUpperCase()}
                    </span>
                    <span style={{ color: "var(--text3)", fontSize: 11 }}>Vol {vol}</span>
                  </div>
                ) : (
                  <div style={{ color: "var(--text3)", fontSize: 12 }}>
                    Pending approval
                  </div>
                )}

                {/* Creator */}
                <div style={{ marginTop: 10, color: "var(--text3)", fontSize: 11 }}>
                  by @{m.creatorDisplay || m.creatorUsername || "unknown"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
